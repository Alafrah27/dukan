export const DEFAULT_CURRENCY = "SAR";

export const formatCurrency = (amount, currencyCode = DEFAULT_CURRENCY) => {
  const code = currencyCode || DEFAULT_CURRENCY;
  try {
    const formatter = new Intl.NumberFormat("sa-SA", {
      style: "currency",
      currency: code,
    });
    return formatter.format(Number(amount) || 0);
  } catch (_) {
    return `${amount} ${code}`;
  }
};
