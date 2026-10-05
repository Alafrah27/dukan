import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  Pressable,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowRight, PackageOpen } from "lucide-react-native";
import Toast from "react-native-toast-message";
import DukanText from "../../../components/DukanText";
import Colors from "../../../constants/Colors";
import ProductItem from "../../../components/home/productItem";
import { useInfiniteProducts } from "../../../store/productQuery";
import { useGetActiveOffers } from "../../../store/offerQuery";
import { buildOfferMap } from "../../../utils/offers";
import useRtl from "../../../hooks/useRtl";

/**
 * Skeleton Loader for 2-column product grid using NativeWind styling
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
    <View className="flex-row flex-wrap px-2.5 pt-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} className="w-1/2 p-1.5">
          <View className="bg-white rounded-2xl overflow-hidden border border-[rgba(48,37,34,0.05)]">
            <Animated.View
              className="w-full h-[145px] bg-[#EBDDD6]"
              style={{ opacity: pulse }}
            />
            <View className="p-2.5 gap-2">
              <Animated.View
                className="w-2/5 h-2.5 rounded-full bg-[#EBDDD6] self-end"
                style={{ opacity: pulse }}
              />
              <Animated.View
                className="w-4/5 h-3 rounded-full bg-[#EBDDD6] self-end"
                style={{ opacity: pulse }}
              />
              <Animated.View
                className="w-1/2 h-3.5 rounded-full bg-[#EBDDD6] mt-1 self-end"
                style={{ opacity: pulse }}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * CustomerCategoryList Screen
 *
 * Displays products belonging to a specific category:
 * - NativeWind utility classes for styling
 * - Seamless background without white header box
 * - Category title without length count
 * - 2-column ProductItem grid
 * - Infinite scroll pagination & pull-to-refresh
 * - RTL-aware navigation
 */
export default function CustomerCategoryList() {
  const router = useRouter();
  const { isRtl, row } = useRtl();
  const params = useLocalSearchParams();

  const categoryId = params.categoryId ? String(params.categoryId) : undefined;
  const categoryName = params.name ? String(params.name) : "";

  const [refreshing, setRefreshing] = useState(false);

  // Infinite paginated query filtered by categoryId
  const {
    data: infiniteData,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteProducts({
    categoryId,
    isAvailable: true,
    limit: 10,
  });

  // Active offers query for discounts
  const { data: offersData } = useGetActiveOffers();

  const offerMap = useMemo(() => {
    const activeOffers = offersData?.offers || [];
    return buildOfferMap(activeOffers);
  }, [offersData?.offers]);

  // Flattened products array
  const products = useMemo(() => {
    return infiniteData?.pages?.flatMap((page) => page?.products || []) || [];
  }, [infiniteData]);

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleProductPress = (product) => {
    router.push({
      pathname: "/[id]",
      params: { id: product._id },
    });
  };

  const handleAddToCart = (product) => {
    Toast.show({
      type: "success",
      text1: isRtl ? "تمت الإضافة بنجاح" : "Added successfully",
      text2: product.name,
      position: "bottom",
      visibilityTime: 2000,
    });
  };

  // Header Bar with Back Button and Category Title (no white background, no length counter)
  const renderHeader = () => (
    <View className="px-4 py-3">
      <View
        className="items-center justify-between"
        style={{ flexDirection: row }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRtl ? "رجوع" : "Back"}
          onPress={() => router.back()}
          hitSlop={8}
          className="w-10 h-10 items-center justify-center active:opacity-70"
        >
          <ArrowRight
            size={22}
            color={Colors.text}
            style={{ transform: [{ scaleX: isRtl ? 1 : -1 }] }}
          />
        </Pressable>

        <View className="flex-1 items-center justify-center px-2">
          <DukanText
            bold
            numberOfLines={1}
            className="text-lg text-text text-center"
          >
            {categoryName || (isRtl ? "المنتجات" : "Products")}
          </DukanText>
        </View>

        {/* Symmetric spacer */}
        <View className="w-10 h-10" />
      </View>
    </View>
  );

  // Footer loader for infinite scroll pagination
  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View className="py-5 items-center justify-center">
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }
    return <View className="h-6" />;
  };

  // Empty state when category has no products
  const renderEmpty = () => {
    if (isLoading) {
      return <ProductsSkeleton />;
    }

    return (
      <View className="px-5 py-16 items-center justify-center">
        <View className="w-20 h-20 items-center justify-center mb-4">
          <PackageOpen size={48} color={Colors.textSecondary} />
        </View>
        <DukanText bold className="text-base text-text text-center">
          {isRtl ? "لا توجد منتجات حالياً" : "No Products Found"}
        </DukanText>
        <DukanText className="text-xs text-textSecondary text-center mt-2 px-6 leading-5">
          {isRtl
            ? "لم تتم إضافة أي منتجات إلى هذا القسم بعد. يمكنك تصفح الأقسام الأخرى."
            : "No products have been added to this category yet. You can explore other categories."}
        </DukanText>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="mt-6 bg-primary px-6 py-3 rounded-xl active:opacity-85"
        >
          <DukanText bold className="text-sm text-white">
            {isRtl ? "تصفح باقي الأقسام" : "Browse Categories"}
          </DukanText>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {renderHeader()}

      <FlatList
        data={products}
        keyExtractor={(item, index) => item._id || String(index)}
        numColumns={2}
        columnWrapperStyle={{
          flexDirection: isRtl ? "row-reverse" : "row",
          paddingHorizontal: 10,
        }}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: 28,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="w-1/2 p-1.5">
            <ProductItem
              product={item}
              offer={offerMap[item._id]}
              onPress={handleProductPress}
              onAddToCart={handleAddToCart}
            />
          </View>
        )}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}