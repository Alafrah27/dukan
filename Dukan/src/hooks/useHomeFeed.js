import { useCallback, useMemo, useState } from "react";
import { useGetActiveOffers } from "../store/offerQuery";
import { useGetCategories } from "../store/categoryQuery";
import { useInfiniteProducts } from "../store/productQuery";
import { buildOfferMap } from "../utils/offers";

const PRODUCTS_PAGE_SIZE = 10;

/**
 * Aggregates all data needed by the customer home screen.
 */
export default function useHomeFeed() {
  const offersQuery = useGetActiveOffers();
  const categoriesQuery = useGetCategories();
  const productsQuery = useInfiniteProducts({
    limit: PRODUCTS_PAGE_SIZE,
    isAvailable: true,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const offers = useMemo(
    () => (offersQuery.data?.offers || []).filter((offer) => offer.thumbnail_image),
    [offersQuery.data]
  );

  const offerMap = useMemo(
    () => buildOfferMap(offersQuery.data?.offers || []),
    [offersQuery.data]
  );

  const categories = categoriesQuery.data?.categories || [];

  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page?.products || []) || [],
    [productsQuery.data]
  );

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = productsQuery;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        offersQuery.refetch(),
        categoriesQuery.refetch(),
        productsQuery.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [offersQuery.refetch, categoriesQuery.refetch, productsQuery.refetch]);

  return {
    offers,
    offerMap,
    categories,
    products,
    isOffersLoading: offersQuery.isLoading,
    isCategoriesLoading: categoriesQuery.isLoading,
    isProductsLoading: productsQuery.isLoading,
    isProductsError: productsQuery.isError,
    isFetchingNextPage,
    isRefreshing,
    loadMore,
    refresh,
    retryProducts: productsQuery.refetch,
  };
}
