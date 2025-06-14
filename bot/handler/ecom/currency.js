export const currency = {
  code: 'TWD',
  name: 'New Taiwan Dollar',
  symbol: 'NT$',
  decimals: 0,
};

export function format(amount) {
  return `${currency.symbol}${amount.toFixed(currency.decimals)}`;
}
