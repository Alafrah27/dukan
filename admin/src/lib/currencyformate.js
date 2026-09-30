export const currencyFormate = (amount) => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
  }).format(amount);
}