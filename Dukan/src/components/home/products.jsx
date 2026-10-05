import React, { useMemo, useRef, useEffect } from "react";
import {
  View,
  Pressable,
  FlatList,
  Animated,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import Toast from "react-native-toast-message";
import DukanText from "../DukanText";
import Colors from "../../constants/Colors";
import ProductItem from "./productItem";
import { useInfiniteProducts } from "../../store/productQuery";
import { useGetActiveOffers } from "../../store/offerQuery";
import { buildOfferMap } from "../../utils/offers";
import useRtl from "../../hooks/useRtl";

/**
 * Skeleton Loader for 2-column product grid
 */
function ProductsSkeleton() {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.gridItem}>
          <View style={styles.skeletonCard}>
            <Animated.View style={[styles.skeletonImage, { opacity: pulse }]} />
            <View style={styles.skeletonInfo}>
              <Animated.View style={[styles.skeletonLineShort, { opacity: pulse }]} />
              <Animated.View style={[styles.skeletonLineLong, { opacity: pulse }]} />
              <Animated.View style={[styles.skeletonLinePrice, { opacity: pulse }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Products Section Component
 *
 * Implements a 2-column FlatList with infinite scroll pagination,
 * active offer discount mapping, pull-to-refresh, and customizable header integration.
 */
export default function Products({
  products: propProducts,
  title = "أحدث المنتجات",
  onPressProduct,
  onAddToCart,
  onViewAll,
  limit = 10,
  ListHeaderComponent,
  refreshing = false,
  onRefresh,
}) {
  const router = useRouter();
  const { isRtl } = useRtl();

  // Infinite paginated products query
  const {
    data: infiniteData,
    isLoading: isProductsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteProducts({
    limit,
    isAvailable: true,
  });

  // Active offers query for discounts
  const { data: offersData } = useGetActiveOffers();

  // Map product IDs to their best active offer
  const offerMap = useMemo(() => {
    const activeOffers = offersData?.offers || [];
    return buildOfferMap(activeOffers);
  }, [offersData?.offers]);

  // Flattened products array across all paginated pages
  const products = useMemo(() => {
    if (propProducts && Array.isArray(propProducts)) return propProducts;
    return (
      infiniteData?.pages?.flatMap((page) => page?.products || []) || []
    );
  }, [propProducts, infiniteData]);

  // Trigger next page when user scrolls near the end
  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleProductPress = (product) => {
    if (onPressProduct) {
      onPressProduct(product);
      return;
    }
    router.push({
      pathname: "/[id]",
      params: { id: product._id },
    });
  };

  const handleAddToCart = (product) => {
    if (onAddToCart) {
      onAddToCart(product);
      return;
    }

    Toast.show({
      type: "success",
      text1: "تمت الإضافة بنجاح",
      text2: product.name,
      position: "bottom",
      visibilityTime: 2000,
    });
  };

  const handleViewAllPress = () => {
    if (onViewAll) {
      onViewAll();
      return;
    }
    router.push("/search");
  };

  // Header incorporating optional parent components (like Banner & Categories) and title row
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {ListHeaderComponent}

      <View
        style={[
          styles.headerRow,
          { flexDirection: isRtl ? "row-reverse" : "row" },
        ]}
      >
        <DukanText bold className="text-base text-text">
          {title}
        </DukanText>

        <Pressable
          activeOpacity={0.7}
          onPress={handleViewAllPress}
          style={[
            styles.viewAllButton,
            { flexDirection: isRtl ? "row-reverse" : "row" },
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="عرض الكل"
        >
          <DukanText medium className="text-xs text-primary">
            {isRtl ? "عرض الكل" : "See All"}
          </DukanText>
          {isRtl ? (
            <ChevronLeft size={15} color={Colors.primary} />
          ) : (
            <ChevronRight size={15} color={Colors.primary} />
          )}
        </Pressable>
      </View>
    </View>
  );

  // Bottom loader during pagination
  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }
    return <View style={{ height: 28 }} />;
  };

  // Empty state when no products exist
  const renderEmpty = () => {
    if (isProductsLoading) {
      return <ProductsSkeleton />;
    }
    return (
      <View style={styles.emptyContainer}>
        <DukanText className="text-xs text-textSecondary text-center">
          {isRtl ? "لا توجد منتجات متاحة حالياً" : "No products available"}
        </DukanText>
      </View>
    );
  };

  return (
    <FlatList
      data={products}
      keyExtractor={(item, index) => item._id || String(index)}
      numColumns={2}
      columnWrapperStyle={[
        styles.columnWrapper,
        { flexDirection: isRtl ? "row-reverse" : "row" },
      ]}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={styles.gridItem}>
          <ProductItem
            product={item}
            offer={offerMap[item._id]}
            onPress={handleProductPress}
            onAddToCart={handleAddToCart}
          />
        </View>
      )}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            progressBackgroundColor="#FFFFFF"
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
  headerContainer: {
    width: "100%",
  },
  headerRow: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 10,
  },
  viewAllButton: {
    alignItems: "center",
    gap: 2,
  },
  columnWrapper: {
    paddingHorizontal: 10,
    justifyContent: "flex-start",
  },
  gridItem: {
    width: "50%",
    padding: 6,
  },
  footerLoader: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(48, 37, 34, 0.05)",
  },
  skeletonImage: {
    width: "100%",
    height: 145,
    backgroundColor: "#EBDDD6",
  },
  skeletonInfo: {
    padding: 10,
    gap: 8,
  },
  skeletonLineShort: {
    width: "40%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EBDDD6",
    alignSelf: "flex-end",
  },
  skeletonLineLong: {
    width: "80%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EBDDD6",
    alignSelf: "flex-end",
  },
  skeletonLinePrice: {
    width: "50%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EBDDD6",
    marginTop: 4,
  },
});