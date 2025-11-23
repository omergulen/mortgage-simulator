// German Tax Constants
const TAX_CONSTANTS = {
  TEILFREISTELLUNG: 0.30, // 30% tax-free for equity ETFs
  TAXABLE_PORTION: 0.70,  // 70% taxable
  TAX_RATE: 0.26375,      // 26.375% (25% + Soli)
  SPARER_PAUSCHBETRAG: 1000, // 1,000€ yearly tax-free allowance
}

export interface Scenario {
  id: string
  name: string
  loanAmount: number
  interestRate: number
  monthlyPayment: number
  extraYearly?: number
  propertyValue: number
  initialETF?: number
  monthlyETF?: number
  etfReturn?: number
  inflation?: number
}

export interface AmortizationEntry {
  month: number
  year: number
  balance: number
  interestPayment: number
  principalPayment: number
  extraPayment: number
  totalPayment: number
}

export interface AmortizationResult {
  schedule: AmortizationEntry[]
  totalInterest: number
  totalPrincipal: number
  totalExtra: number
  finalBalance: number
  payoffMonths: number
}

export interface ETFResult {
  futureValue: number
  gains: number
  tax: number
  afterTaxValue: number
  afterTaxNominal: number
  afterTaxReal: number
  totalHarvested?: number
  finalTax?: number
  strategy: 'none' | 'full' | 'partial' | 'optimal'
}

export type HarvestingStrategy = 'none' | 'full' | 'partial' | 'optimal'

export class MortgageCalculator {
  /**
   * Calculate monthly interest rate from annual rate
   */
  static monthlyRate(annualRate: number): number {
    return annualRate / 100 / 12
  }

  /**
   * Calculate amortization schedule for a mortgage
   */
  static calculateAmortization(scenario: Scenario, years = 30): AmortizationResult {
    const {
      loanAmount,
      interestRate,
      monthlyPayment,
      extraYearly = 0
    } = scenario

    const monthlyRate = this.monthlyRate(interestRate)
    const totalMonths = years * 12
    const schedule: AmortizationEntry[] = []
    let balance = loanAmount
    let totalInterest = 0
    let totalPrincipal = 0
    let totalExtra = 0

    for (let month = 1; month <= totalMonths && balance > 0.01; month++) {
      const interestPayment = balance * monthlyRate
      let principalPayment = monthlyPayment - interestPayment
      
      // Apply extra yearly payment in December
      let extraPayment = 0
      if (month % 12 === 0 && extraYearly > 0) {
        extraPayment = Math.min(extraYearly, balance)
        totalExtra += extraPayment
      }

      // Ensure we don't overpay
      if (principalPayment + extraPayment > balance) {
        principalPayment = balance - extraPayment
      }

      balance = Math.max(0, balance - principalPayment - extraPayment)
      totalInterest += interestPayment
      totalPrincipal += principalPayment + extraPayment

      schedule.push({
        month,
        year: Math.ceil(month / 12),
        balance: Math.max(0, balance),
        interestPayment,
        principalPayment,
        extraPayment,
        totalPayment: monthlyPayment + extraPayment
      })

      // If balance is paid off, stop
      if (balance < 0.01) break
    }

    return {
      schedule,
      totalInterest,
      totalPrincipal,
      totalExtra,
      finalBalance: schedule[schedule.length - 1]?.balance || 0,
      payoffMonths: schedule.length
    }
  }

  /**
   * Get remaining balance at specific year
   */
  static getBalanceAtYear(scenario: Scenario, targetYear: number): number {
    const amortization = this.calculateAmortization(scenario, targetYear + 5)
    const targetMonth = targetYear * 12
    const entry = amortization.schedule.find(e => e.month === targetMonth) ||
                 amortization.schedule[amortization.schedule.length - 1]
    return entry ? entry.balance : 0
  }

  /**
   * Calculate years to full payoff
   */
  static getPayoffYears(scenario: Scenario): number {
    const amortization = this.calculateAmortization(scenario, 50)
    return amortization.payoffMonths / 12
  }

  /**
   * Calculate total paid over a period
   */
  static getTotalPaid(scenario: Scenario, years: number): number {
    const amortization = this.calculateAmortization(scenario, years)
    return amortization.totalPrincipal + amortization.totalInterest
  }

  /**
   * Calculate ETF future value with German tax optimization
   */
  static calculateETF(scenario: Scenario, years: number, strategy: HarvestingStrategy = 'optimal'): ETFResult {
    const {
      initialETF = 0,
      monthlyETF = 0,
      etfReturn = 7.0,
    } = scenario

    const monthlyReturn = etfReturn / 100 / 12

    switch (strategy) {
      case 'full':
        return this.calculateETFFullHarvest(
          initialETF,
          monthlyETF,
          monthlyReturn,
          years
        )
      case 'partial':
        return this.calculateETFPartialHarvest(
          initialETF,
          monthlyETF,
          monthlyReturn,
          years
        )
      case 'optimal':
        return this.calculateETFOptimalHarvest(
          initialETF,
          monthlyETF,
          monthlyReturn,
          years
        )
      case 'none':
      default:
        return this.calculateETFSimple(
          initialETF,
          monthlyETF,
          monthlyReturn,
          years
        )
    }
  }

  /**
   * Simple ETF calculation (one-time tax at end)
   */
  static calculateETFSimple(initial: number, monthly: number, monthlyReturn: number, years: number): ETFResult {
    let value = initial
    const totalMonths = years * 12

    for (let month = 1; month <= totalMonths; month++) {
      value = value * (1 + monthlyReturn) + monthly
    }

    const gains = value - initial - (monthly * totalMonths)
    const taxableGains = gains * TAX_CONSTANTS.TAXABLE_PORTION
    const finalTax = Math.max(0, taxableGains - TAX_CONSTANTS.SPARER_PAUSCHBETRAG) * TAX_CONSTANTS.TAX_RATE
    const afterTaxValue = value - finalTax

    return {
      futureValue: value,
      gains,
      tax: 0,
      afterTaxValue,
      afterTaxNominal: afterTaxValue,
      afterTaxReal: afterTaxValue / Math.pow(1 + monthlyReturn * 12, years),
      finalTax,
      strategy: 'none'
    }
  }

  /**
   * Strategy 1: Full buy/sell every year (sell everything, rebuy)
   */
  static calculateETFFullHarvest(initial: number, monthly: number, monthlyReturn: number, years: number): ETFResult {
    let value = initial
    let costBasis = initial
    const totalMonths = years * 12
    let totalTaxPaid = 0
    let totalHarvested = 0

    for (let year = 1; year <= years; year++) {
      // Grow value throughout the year
      for (let month = 1; month <= 12; month++) {
        value = value * (1 + monthlyReturn)
        if (monthly > 0) {
          value += monthly
          costBasis += monthly
        }
      }

      // At year end: sell everything, realize all gains, rebuy
      const gains = value - costBasis
      if (gains > 0) {
        const taxableGains = gains * TAX_CONSTANTS.TAXABLE_PORTION
        const tax = Math.max(0, taxableGains - TAX_CONSTANTS.SPARER_PAUSCHBETRAG) * TAX_CONSTANTS.TAX_RATE
        totalTaxPaid += tax
        totalHarvested += gains
        
        // Reset: value stays the same (we rebuy), but cost basis resets to current value
        costBasis = value
      }
    }

    const finalGains = value - initial - (monthly * totalMonths)
    const afterTaxValue = value - totalTaxPaid

    return {
      futureValue: value,
      gains: finalGains,
      tax: totalTaxPaid,
      afterTaxValue,
      afterTaxNominal: afterTaxValue,
      afterTaxReal: afterTaxValue / Math.pow(1 + monthlyReturn * 12, years),
      totalHarvested,
      finalTax: 0,
      strategy: 'full'
    }
  }

  /**
   * Strategy 2: Partial harvest - sell only up to tax-free limit, keep rest, show final tax
   */
  static calculateETFPartialHarvest(initial: number, monthly: number, monthlyReturn: number, years: number): ETFResult {
    let value = initial
    let costBasis = initial
    const totalMonths = years * 12
    let totalHarvested = 0
    const maxHarvestablePerYear = TAX_CONSTANTS.SPARER_PAUSCHBETRAG / TAX_CONSTANTS.TAXABLE_PORTION

    for (let year = 1; year <= years; year++) {
      // Grow value throughout the year
      for (let month = 1; month <= 12; month++) {
        value = value * (1 + monthlyReturn)
        if (monthly > 0) {
          value += monthly
          costBasis += monthly
        }
      }

      // At year end: harvest only up to tax-free limit
      const unrealizedGains = value - costBasis
      if (unrealizedGains > 0) {
        const harvestAmount = Math.min(unrealizedGains, maxHarvestablePerYear)
        if (harvestAmount > 0) {
          totalHarvested += harvestAmount
          const harvestRatio = harvestAmount / unrealizedGains
          // Adjust cost basis proportionally: when we harvest gains, we realize a portion
          // The remaining cost basis should be reduced proportionally
          costBasis = costBasis * (1 - harvestRatio)
        }
      }
    }

    const finalGains = value - initial - (monthly * totalMonths)
    const remainingUnrealized = finalGains - totalHarvested
    const finalTaxable = remainingUnrealized * TAX_CONSTANTS.TAXABLE_PORTION
    const finalTax = Math.max(0, finalTaxable - TAX_CONSTANTS.SPARER_PAUSCHBETRAG) * TAX_CONSTANTS.TAX_RATE
    
    const afterTaxValue = value - finalTax

    return {
      futureValue: value,
      gains: finalGains,
      tax: 0,
      afterTaxValue,
      afterTaxNominal: afterTaxValue,
      afterTaxReal: afterTaxValue / Math.pow(1 + monthlyReturn * 12, years),
      totalHarvested,
      finalTax,
      strategy: 'partial'
    }
  }

  /**
   * Strategy 3: Optimal harvest - sell optimal amount each year, keep rest, show final tax
   */
  static calculateETFOptimalHarvest(initial: number, monthly: number, monthlyReturn: number, years: number): ETFResult {
    let value = initial
    let costBasis = initial
    const totalMonths = years * 12
    const monthlyContributions: Array<{ month: number; amount: number; costBasis: number }> = []

    // Track monthly contributions for FIFO
    for (let month = 1; month <= totalMonths; month++) {
      value = value * (1 + monthlyReturn)
      
      if (monthly > 0) {
        value += monthly
        monthlyContributions.push({
          month,
          amount: monthly,
          costBasis: monthly
        })
      }
    }

    // Simulate yearly harvesting
    let totalHarvested = 0
    let remainingCostBasis = costBasis
    const contributions = [...monthlyContributions]

    for (let year = 1; year <= years; year++) {
      const yearEndMonth = year * 12
      
      // Calculate value at year end
      let yearValue = initial
      for (let m = 1; m <= yearEndMonth; m++) {
        yearValue = yearValue * (1 + monthlyReturn)
        const contrib = monthlyContributions.find(c => c.month === m)
        if (contrib) yearValue += contrib.amount
      }

      // Calculate unrealized gains
      let totalCostBasis = initial
      for (const contrib of contributions.filter(c => c.month <= yearEndMonth)) {
        totalCostBasis += contrib.amount
      }

      const unrealizedGains = yearValue - totalCostBasis
      
      // Harvest up to tax-free limit
      const maxHarvestable = TAX_CONSTANTS.SPARER_PAUSCHBETRAG / TAX_CONSTANTS.TAXABLE_PORTION
      const harvestAmount = Math.min(unrealizedGains, maxHarvestable)
      
      if (harvestAmount > 0) {
        totalHarvested += harvestAmount
        const harvestRatio = harvestAmount / unrealizedGains
        remainingCostBasis = totalCostBasis * (1 - harvestRatio)
      } else {
        remainingCostBasis = totalCostBasis
      }
    }

    // Final value calculation
    let finalValue = initial
    for (let m = 1; m <= totalMonths; m++) {
      finalValue = finalValue * (1 + monthlyReturn)
      const contrib = monthlyContributions.find(c => c.month === m)
      if (contrib) finalValue += contrib.amount
    }

    // Final tax calculation
    const finalGains = finalValue - initial - (monthly * totalMonths)
    const remainingUnrealized = finalGains - totalHarvested
    const finalTaxable = remainingUnrealized * TAX_CONSTANTS.TAXABLE_PORTION
    const finalTax = Math.max(0, finalTaxable - TAX_CONSTANTS.SPARER_PAUSCHBETRAG) * TAX_CONSTANTS.TAX_RATE
    
    const afterTaxValue = finalValue - finalTax

    return {
      futureValue: finalValue,
      gains: finalGains,
      tax: 0,
      afterTaxValue,
      afterTaxNominal: afterTaxValue,
      afterTaxReal: afterTaxValue / Math.pow(1 + monthlyReturn * 12, years),
      totalHarvested,
      finalTax,
      strategy: 'optimal'
    }
  }

  /**
   * Calculate comprehensive scenario comparison
   */
  static compareScenarios(scenarios: Scenario[], horizonYears = 20, harvestingStrategy: HarvestingStrategy = 'optimal') {
    return scenarios.map(scenario => {
      const result: any = {
        ...scenario,
        payoffYears: this.getPayoffYears(scenario),
        etfDetails: this.calculateETF(scenario, horizonYears, harvestingStrategy)
      }

      // Calculate metrics for all relevant years based on horizon
      if (horizonYears >= 10) {
        result.balance10y = this.getBalanceAtYear(scenario, 10)
        const amortization10y = this.calculateAmortization(scenario, 10)
        result.totalPaid10y = amortization10y.totalInterest + amortization10y.totalPrincipal
        result.totalInterest10y = amortization10y.totalInterest
        result.equity10y = scenario.propertyValue - result.balance10y
        const etf10y = this.calculateETF(scenario, 10, harvestingStrategy)
        result.etfValue10y = etf10y.afterTaxValue
        result.netWorth10y = result.equity10y + result.etfValue10y
      }

      if (horizonYears >= 20) {
        result.balance20y = this.getBalanceAtYear(scenario, 20)
        const amortization20y = this.calculateAmortization(scenario, 20)
        result.totalPaid20y = amortization20y.totalInterest + amortization20y.totalPrincipal
        result.totalInterest20y = amortization20y.totalInterest
        result.equity20y = scenario.propertyValue - result.balance20y
        const etf20y = this.calculateETF(scenario, 20, harvestingStrategy)
        result.etfValue20y = etf20y.afterTaxValue
        result.netWorth20y = result.equity20y + result.etfValue20y
      }

      if (horizonYears >= 30) {
        result.balance30y = this.getBalanceAtYear(scenario, 30)
        const amortization30y = this.calculateAmortization(scenario, 30)
        result.totalPaid30y = amortization30y.totalInterest + amortization30y.totalPrincipal
        result.totalInterest30y = amortization30y.totalInterest
        result.equity30y = scenario.propertyValue - result.balance30y
        const etf30y = this.calculateETF(scenario, 30, harvestingStrategy)
        result.etfValue30y = etf30y.afterTaxValue
        result.netWorth30y = result.equity30y + result.etfValue30y
      }

      // Set final values based on horizon
      const finalYear = horizonYears
      result.etfValue = result.etfDetails.afterTaxValue
      result.netWorth = result[`netWorth${finalYear}y`] || result.netWorth20y || result.netWorth10y

      return result
    })
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Format percentage
   */
  static formatPercent(value: number, decimals = 2): string {
    return `${value.toFixed(decimals)}%`
  }
}

