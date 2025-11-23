# Mortgage Scenario Comparator - React SPA

A modern Single Page Application (SPA) for comparing mortgage scenarios with detailed amortization schedules and ETF optimization strategies.

## Tech Stack

- **React 19** with TypeScript
- **Vite** - Build tool and dev server
- **TanStack Router** - Type-safe routing
- **Zustand** - State management with persistence
- **Tailwind CSS** - Styling with custom theme (orange primary color, dark mode support)
- **Radix UI** - Accessible component primitives
- **Recharts** - Chart library for data visualization

## Features

- ✅ Compare multiple mortgage scenarios side-by-side
- ✅ Dynamic time horizon selection (10, 20, or 30 years)
- ✅ Multiple ETF tax-gain harvesting strategies:
  - No harvesting (tax at end)
  - Full buy/sell every year
  - Partial harvest (tax-free limit only)
  - Optimal harvest (best strategy)
- ✅ Detailed amortization schedules
- ✅ Interactive comparison table with sorting
- ✅ Visual charts for balance and net worth over time
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Local storage persistence

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (Button, Card, Input, etc.)
│   ├── mortgage-simulator.tsx    # Main application component
│   ├── global-config.tsx         # Global configuration (time horizon, harvesting strategy)
│   ├── scenario-form-modal.tsx   # Add/Edit scenario form
│   ├── comparison-table.tsx      # Comparison table with sorting
│   ├── detailed-view.tsx         # Detailed scenario analysis
│   └── charts.tsx                # Data visualizations
├── lib/
│   ├── mortgage-calculator.ts    # Core calculation logic
│   ├── stores/
│   │   └── mortgage-store.ts    # Zustand store for state management
│   └── utils/
│       ├── cn.ts                 # Class name utility
│       └── parse-number.ts       # Flexible number parsing
└── routes/                       # TanStack Router routes
```

## Usage

1. **Add a Scenario**: Click "Add New Scenario" and fill in the mortgage details
2. **Compare**: View all scenarios in the comparison table
3. **Sort**: Click column headers to sort the table
4. **View Details**: Select a scenario from the dropdown to see detailed analysis
5. **Edit/Duplicate/Delete**: Use the action buttons in the comparison table or detailed view
6. **Configure**: Adjust time horizon and harvesting strategy in the global config section

## Number Format Support

The application supports various number formats for user input:
- European: `1.000,50` or `1 000,50`
- US: `1,000.50` or `1000.50`
- Mixed formats are automatically detected and parsed

## Theme

The application uses a custom Tailwind theme matching the yalla project:
- Orange primary color (#F5A623)
- Dark mode support
- Consistent styling across all components

## License

MIT
