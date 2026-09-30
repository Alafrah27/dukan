export const formatCurrency = (amount, currencyCode) => {
  const formatter = new Intl.NumberFormat("sa-SA", {
    style: "currency",
    currency: currencyCode,
  });
  return formatter.format(amount);
};
