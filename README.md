# Mortgage Scenario Comparator

A comprehensive web application to compare multiple mortgage scenarios with detailed amortization schedules, ETF investment analysis, and German tax optimization.

## Features

### 🏠 Mortgage Analysis
- Compare multiple mortgage offers side-by-side
- Detailed amortization schedules
- Calculate remaining balance at 10/20/30 years
- Track total interest paid and equity built
- Support for extra yearly payments (Sondertilgung)
- Calculate years to full payoff

### 📈 ETF Investment Analysis
- Model ETF investments with monthly contributions
- Calculate future values with compound interest
- Compare scenarios with different investment strategies

### 🇩🇪 German Tax Optimization
- **Teilfreistellung**: 30% tax-free portion for equity ETFs
- **Tax Rate**: 26.375% (25% + Soli) on taxable gains
- **Sparer-Pauschbetrag**: 1,000€ yearly tax-free allowance
- **Tax-Gain Harvesting**: Optimize taxes by harvesting gains yearly (up to tax-free limit)
- FIFO-based cost basis tracking

### 📊 Visualizations
- Interactive charts showing loan balance over time
- Net worth comparison across scenarios
- Responsive design for desktop and mobile

## How to Use

1. **Open the Application**
   - Simply open `index.html` in your web browser
   - No server or installation required!

2. **Add Mortgage Scenarios**
   - Fill in the form with your mortgage details:
     - Scenario name (e.g., "306k MBS Interhyp")
     - Loan amount
     - Interest rate (% per annum)
     - Monthly payment
     - Extra yearly payment (optional)
     - Property value
     - ETF investment details (optional)
   - Click "Add Scenario" to save

3. **Compare Scenarios**
   - View the comparison table showing all key metrics
   - Toggle tax-gain harvesting on/off
   - Adjust comparison horizon (10/20/30 years)

4. **View Detailed Analysis**
   - Select a scenario from the dropdown
   - See comprehensive metrics including:
     - Loan metrics (balance, interest, payoff time)
     - Equity calculations
     - ETF investment performance
     - Net worth summary
     - Amortization schedule (first 5 years)

5. **Visualize Results**
   - Charts automatically update as you add scenarios
   - Compare loan balances over time
   - Compare net worth across scenarios

## Data Persistence

Your scenarios are automatically saved to your browser's local storage. They will persist between sessions.

## Example Scenarios

Based on your document, here are some example scenarios you might want to add:

### 306k MBS Interhyp (3.51%)
- Loan Amount: 306,000€
- Interest Rate: 3.51%
- Monthly Payment: (calculate based on your terms)
- Extra Yearly: 0€, 2,000€, or 5%

### 323k Interhyp (3.75%)
- Loan Amount: 323,000€
- Interest Rate: 3.75%
- Monthly Payment: (calculate based on your terms)
- Initial ETF: 17,000€ (down-payment difference)
- Extra Yearly: 0€, 2,000€, or 5%

## Technical Details

### German Tax Calculations

The application implements correct German tax law for equity ETFs:

- **30% Teilfreistellung**: 30% of gains are tax-free
- **70% Taxable**: Only 70% of gains are subject to tax
- **26.375% Tax Rate**: 25% capital gains tax + 5.5% Soli
- **1,000€ Yearly Allowance**: Sparer-Pauschbetrag applied yearly with tax-gain harvesting

### Tax-Gain Harvesting

When enabled, the application:
- Realizes gains up to the tax-free limit each year
- Uses FIFO (First In, First Out) cost basis tracking
- Maximizes after-tax returns legally
- No wash-sale rules in Germany (unlike US)

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Files

- `index.html` - Main application structure
- `styles.css` - Styling and responsive design
- `mortgage-calculator.js` - Core calculation engine
- `app.js` - Application logic and UI interactions

## License

Free to use for personal financial planning.

