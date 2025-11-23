# Mortgage & ETF Optimization Model --- Full Summary

## 1. Goals

You want a **single Google Sheet modeling**: - multiple mortgage offers
(306k / 323k) - different Sondertilgung strategies (0, 2,000€, 5%) -
10--20 year comparison horizon - long-term projections (30+ years) -
refinancing, payoff duration, and total interest - ETF opportunity-cost
modeling - **correct German tax law**, including: - 1,000€ yearly
Sparer-Pauschbetrag - 30% Teilfreistellung for equity ETFs - 70% taxable
portion - 26.375% effective tax rate - **tax-gain harvesting
optimization** - FIFO-based cost basis adjustments

The sheet has **three components**: 1. `Scenarios` -- all offers + all
parameters 2. `Comparison` -- auto-calculated results for all scenarios
3. `Amortization` -- detailed schedule for one scenario 4. `ETF_Harvest`
-- yearly tax-free harvesting optimizer

------------------------------------------------------------------------

## 2. Scenarios Sheet

Each row defines a *scenario*:

    ScenarioID | OfferName | LoanAmount | Interest_p_a | PaymentMonthly |
    ExtraYearlyST | YearsTotal | PropertyValue | ETFRet_p_a |
    Inflation_p_a | TaxOnGains | InitialETF | MonthlyETF

Scenarios included: - 306k MBS Interhyp (3.51%) - 306k MBS Hypofriend
(3.52%) - 323k Interhyp (3.75%) - 323k Hypofriend (3.76%) Each repeated
with: - no Sondertilgung - 2,000€ yearly ST - 5% yearly ST

ETF rules: - 306k models: monthly ETF contribution = (323k payment −
306k payment) - 323k models: InitialETF = 17,000€ (down-payment
difference)

------------------------------------------------------------------------

## 3. Comparison Sheet

For **every scenario**, computes:

### Loan Metrics

-   Restschuld at 10 years
-   Restschuld at 20 years
-   Total Paid 20 years
-   Total Interest 20 years
-   Equity (nominal & real)
-   Years to full payoff (NPER)
-   Full payoff month/year
-   Total interest over full mortgage

### ETF Metrics (no harvesting model)

-   Futures values (initial + monthly)
-   Gains
-   Taxable portion after Teilfreistellung
-   Pauschbetrag applied once (if no optimization)
-   After-tax nominal & real values
-   Net Worth after 20 years

### ETF Metrics (harvesting model)

-   Annual tax-free harvesting
-   FIFO-correct cost basis
-   Unlimited realization of gains up to Pauschbetrag
-   ZERO tax liability
-   Maximum possible ETF after-tax wealth

------------------------------------------------------------------------

## 4. Amortization Sheet

Given a `SelectedScenarioID`, fetches inputs from `Scenarios` and
builds:

-   full 20-year amortization
-   with:
    -   monthly interest
    -   monthly principal
    -   yearly Sondertilgung (month % 12 = 0)
    -   dynamically adjustable rate/payments

Outputs: - Restschuld at year 10 - Restschuld at year 20 - Total
interest - Total Sondertilgung

------------------------------------------------------------------------

## 5. ETF Harvest Sheet

A full simulation engine:

### Tracks monthly:

-   Starting value
-   New contributions
-   Growth (`(1 + rateMonthly)`)
-   Unrealized gains
-   FIFO-adjusted cost basis
-   End value

### Every December:

-   Computes potential harvested gains
-   Realizes **min(unrealized gains, 1000€ / 0.7 taxable equivalent)**
-   Resets cost basis
-   Keeps value fully invested (harvest ≈ rebuy)

### Final Output:

-   fully tax-optimized after-tax value at year N

This is the **maximum legally achievable after-tax return** in Germany.

------------------------------------------------------------------------

## 6. German Tax Logic Summary

### For equity ETFs:

-   30% of gains are tax-free (Teilfreistellung)
-   70% taxable
-   Tax rate: 26.375% (25% + Soli)
-   Net taxation: 0.7 \* gain \* 0.26375

### If you sell ONE time:

-   Only *one* 1,000€ allowance applies

### If you tax-harvest yearly:

-   You can realize **1,000€ tax-free** every year
-   Perfectly legal
-   No wash-sale rule in Germany
-   Your model now supports this

------------------------------------------------------------------------

## 7. Spreadsheet Architecture (Final Version)

### Sheet: `Scenarios`

All scenario definitions.

### Sheet: `Comparison`

Full auto-calculated metrics for each row in Scenarios.

### Sheet: `Amortization`

Dynamic amortization schedule based on ScenarioID.

### Sheet: `ETF_Harvest`

Year-by-year ETF optimization with: - harvesting - FIFO basis -
reinvestment - final tax-optimized FV

------------------------------------------------------------------------

## 8. Next Steps Optionally Available

Say: - "Export amortization as PDF" - "Generate interactive charts" -
"Add refinancing options after 10 years" - "Add house appreciation
modeling" - "Add rental equivalence comparison" - "Add risk-adjusted
modeling (Monte Carlo ETFs)"

------------------------------------------------------------------------
