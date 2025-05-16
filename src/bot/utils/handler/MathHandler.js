

export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}

export function divide(a, b) {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
}


export function calculateProfit(revenue, cost) {
  return revenue - cost;
}

export function calculateMargin(profit, revenue) {
  if (revenue === 0) throw new Error('Revenue cannot be zero');
  return (profit / revenue) * 100;
}

export function calculateGrowthRate(newValue, oldValue) {
  if (oldValue === 0) throw new Error('Old value cannot be zero');
  return ((newValue - oldValue) / oldValue) * 100;
}

// 損益平衡點（Break-Even Point）
export function calculateBreakEvenPoint(fixedCost, pricePerUnit, variableCostPerUnit) {
  if (pricePerUnit <= variableCostPerUnit) throw new Error('Price per unit must exceed variable cost per unit');
  return fixedCost / (pricePerUnit - variableCostPerUnit);
}

// 投資報酬率（Return on Investment, ROI）
export function calculateROI(gainFromInvestment, costOfInvestment) {
  if (costOfInvestment === 0) throw new Error('Cost of investment cannot be zero');
  return ((gainFromInvestment - costOfInvestment) / costOfInvestment) * 100;
}

// 現值（Present Value, PV）
export function calculatePresentValue(futureValue, rate, periods) {
  return futureValue / (1 + rate) ** periods;
}

// 複利終值（Future Value with Compound Interest）
export function calculateFutureValue(principal, rate, periods) {
  return principal * (1 + rate) ** periods;
}