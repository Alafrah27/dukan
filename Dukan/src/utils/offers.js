/**
 * Display helpers for storefront offers.
 * NOTE: these values are for display only — final prices are always
 * recalculated and validated by the backend.
 */

export const getOfferProductIds = (offer) => {
  const ids = new Set();
  const primary = offer?.productId?._id || offer?.productId;
  if (primary) ids.add(String(primary));
  (offer?.productsId || []).forEach((p) => {
    const id = p?._id || p;
    if (id) ids.add(String(id));
  });
  return [...ids];
};

/** Map of productId -> best active offer for that product */
export const buildOfferMap = (offers = []) => {
  const map = {};
  offers.forEach((offer) => {
    getOfferProductIds(offer).forEach((id) => {
      if (!map[id]) map[id] = offer;
    });
  });
  return map;
};

/**
 * Format price as a clean float / number without trailing floating-point errors (e.g. 108.000000000 -> 108)
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null || price === "") return 0;
  const num = parseFloat(Number(price).toFixed(2));
  return isNaN(num) ? 0 : num;
};

export const getDiscountedPrice = (basePrice, offer) => {
  const price = Number(basePrice) || 0;
  if (!offer || !price) return null;

  const value = Number(offer.value) || 0;
  const discounted =
    offer.type === "fixed" ? price - value : price - (price * value) / 100;

  return discounted > 0 && discounted < price ? formatPrice(discounted) : null;
};
