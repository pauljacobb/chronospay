export const conversionRates = {
  USD: 0.10,
  NGN: 150.0,
  GHS: 1.50,
  KES: 13.0
};

/**
 * Converts XLM amount into target fiat estimated value
 * @param {number|string} amount 
 * @param {string} currency (USD, NGN, GHS, KES)
 * @returns {string}
 */
export function convertXlm(amount, currency) {
  const num = parseFloat(amount) || 0;
  const rate = conversionRates[currency] || 1;
  return (num * rate).toFixed(2);
}

/**
 * Formats a raw number value into local currency symbols
 * @param {number|string} value 
 * @param {string} currency 
 * @returns {string}
 */
export function formatCurrency(value, currency) {
  const num = parseFloat(value) || 0;
  const symbol = {
    USD: '$',
    NGN: '₦',
    GHS: 'GH₵',
    KES: 'KSh'
  }[currency] || '';
  return `${symbol} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
