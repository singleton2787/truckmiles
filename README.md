# 🚛 Trucking Business Tracker

A comprehensive web application for independent truck drivers and owner-operators to track loads, expenses, and calculate real business profitability. Built specifically for contractors working with SINMIC-Independent and compatible with ATBS profit planning assumptions.

## 📋 Features

### 💰 Revenue Tracking
- **Accurate Contract Rates**: Uses actual mileage compensation rates from your contract (ranging from $2.85 to $1.12 per mile based on distance)
- **Real-time Calculations**: Automatically calculates revenue as you enter load details
- **Load Management**: Track origin, destination, miles, dates, and notes for each load

### 📊 Complete Expense Management  
- **Fixed Cost Allocation**: Automatically allocates weekly fixed expenses (truck payment, insurance, permits) per mile
- **Variable Expense Tracking**: Manual entry for fuel, maintenance, parking, supplies, etc.
- **Smart Fuel Calculator**: Built-in MPG calculator for accurate fuel cost tracking
- **ATBS Integration**: Pre-loaded with ATBS average expense data for quick reference

### 📈 Profitability Analysis
- **True Net Profit**: Revenue minus all allocated fixed costs and variable expenses
- **Per-Mile Metrics**: Detailed breakdown of revenue/mile, fixed costs/mile, and profit/mile
- **Visual Dashboard**: Real-time statistics showing total revenue, expenses, and net profit
- **Historical Analysis**: Track profitability trends over time

### 📱 Mobile-First Design
- **Responsive Interface**: Optimized for use on phones, tablets, and desktop
- **Tabbed Navigation**: Easy access to all features on small screens
- **Touch-Friendly**: Large buttons and inputs designed for mobile use

### 💾 Data Management
- **Local Storage**: All data saved locally in your browser - works offline
- **Export/Import**: Backup your data as JSON files
- **Data Persistence**: Never lose your tracking data

## 🚀 Quick Start

### GitHub Pages Deployment
1. **Create a new repository** on GitHub
2. **Upload the HTML file** and name it `index.html`
3. **Enable GitHub Pages**:
   - Go to repository Settings
   - Navigate to Pages section
   - Select "Deploy from branch" and choose `main`
4. **Access your app** at `https://yourusername.github.io/repositoryname`

### Local Usage
1. Download the HTML file
2. Open it in any modern web browser
3. Start tracking your business immediately

## 📖 How to Use

### Adding Loads
1. Navigate to the **"Add Load"** tab
2. Enter load details:
   - Date of the load
   - Total miles driven
   - Origin and destination (optional)
   - Any additional notes
3. The app automatically calculates:
   - Revenue based on contract rates
   - Fixed cost allocation for this load
   - Net profit after fixed costs
4. Click **"Add Load"** to save

### Managing Expenses
1. Go to the **"Add Expenses"** tab
2. Select expense category (fuel, maintenance, insurance, etc.)
3. For fuel expenses:
   - Use the built-in fuel calculator
   - Enter fuel price, your truck's MPG, and miles
   - System calculates total cost and cost per mile
4. For other expenses, enter amount directly
5. Use **"ATBS Average"** presets for quick entry

### Understanding Your Metrics

#### Revenue Calculation
Your contract rates vary by distance:
- 1-20 miles: $2.85/mile
- 21-75 miles: $2.00/mile  
- 76-150 miles: $1.85/mile
- And so on...

#### Fixed Cost Allocation
- Default: $1,112/week ÷ 2,500 miles = $0.45/mile
- Covers truck payment, insurance, permits, licensing
- Adjustable based on your actual expenses

#### Profit Analysis
- **Gross Profit** = Revenue - Fixed Cost Allocation
- **Net Profit** = Gross Profit - Variable Expenses
- **Profit per Mile** = Net Profit ÷ Total Miles

## ⚙️ Configuration

### Customizing Fixed Costs
1. In the "Add Load" tab, find the **Fixed Cost Settings** section
2. Adjust **Weekly Fixed Costs** (default: $1,112)
3. Set your **Expected Weekly Miles** (default: 2,500)
4. The system recalculates cost per mile automatically

### Fuel Calculator Setup
1. Enter current fuel price per gallon
2. Input your truck's average MPG (default: 6.5)
3. Specify miles for the fuel purchase
4. System calculates total cost and per-mile expense

## 📊 ATBS Integration

The app includes expense averages from ATBS profit planning:

### Variable Expenses (37.2¢/mile total)
- Fuel: 14.1¢/mile
- Maintenance: 13.0¢/mile  
- Parking/Tolls: 8.0¢/mile
- Fuel Tax: 0.6¢/mile
- Supplies: 0.8¢/mile
- Travel/Lodging: 0.7¢/mile

### Fixed Expenses ($1,112/week total)
- Truck Payment: $835/week
- Physical Damage Insurance: $150/week
- Work Comp Insurance: $24/week
- Phone/Internet: $28/week
- Licensing & Permits: $31/week
- Professional Services: $22/week
- Other insurance and fees: $22/week

## 💡 Why This App?

### Better Than ATBS Assumptions
- **ATBS assumes**: Flat $1.25/mile revenue
- **Your actual rates**: $1.12 to $2.85/mile (much better!)
- **Accurate tracking**: Shows your real earning potential

### Real Business Intelligence  
- See which load distances are most profitable
- Track if you're meeting ATBS breakeven projections
- Identify expense categories that need attention
- Make informed decisions about load acceptance

### Tax Planning
- Accurate expense tracking for deductions
- Profit calculations for quarterly tax estimates  
- Historical data for year-end tax preparation

## 🔧 Technical Details

- **Framework**: Vanilla HTML, CSS, and JavaScript
- **Storage**: Browser localStorage (client-side only)
- **Compatibility**: Works in all modern browsers
- **Offline**: Functions without internet after initial load
- **Security**: All data stays on your device

## 📱 Mobile Optimization

- Responsive grid layouts that adapt to screen size
- Touch-friendly interface elements
- Optimized text sizes and spacing
- Tabbed navigation for easy mobile use
- Collapsible sections to save screen space

## 🔄 Data Management

### Export Data
- Creates JSON backup file with timestamp
- Includes all loads and expenses
- Can be imported to restore data

### Import Data  
- Restores from JSON backup files
- Validates data format before import
- Replaces all existing data (with confirmation)

### Clear Data
- Option to delete all stored data
- Requires double confirmation
- Cannot be undone

## 🎯 Business Metrics Tracked

### Revenue Metrics
- Total revenue across all loads
- Average revenue per mile
- Revenue by time period
- Load count and frequency

### Expense Metrics
- Fixed costs allocated per mile
- Variable expenses by category
- Total business expenses
- Expense trends over time

### Profitability Metrics
- Net profit after all expenses
- Profit per mile across all loads
- Individual load profitability
- Break-even analysis

## 🚧 Future Enhancements

- [ ] Monthly/quarterly reporting
- [ ] Expense category analysis and charts
- [ ] Tax estimate calculations
- [ ] Load route optimization suggestions
- [ ] Fuel efficiency tracking and trends
- [ ] Integration with accounting software
- [ ] Multi-truck fleet management

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For questions or issues:
1. Check that your browser supports localStorage
2. Ensure JavaScript is enabled
3. Try clearing browser cache if data isn't saving
4. Use export/import for data backup before troubleshooting

## 📞 Contact

Created for independent truck drivers working with SINMIC-Independent and using ATBS business planning services. 

---

**Start tracking your real trucking business profitability today!** 🚛💰
