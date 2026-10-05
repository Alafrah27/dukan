import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  Animated,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Layers } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import DukanText from "../DukanText";
import Colors from "../../constants/Colors";
import CategoryItem from "./CategoryItem";
import { useGetCategories, CATEGORIES_QUERY_KEY } from "../../store/categoryQuery";
import useRtl from "../../hooks/useRtl";

/**
 * Skeleton Loader for categories 2-column grid using NativeWind
 */
function CategoriesSkeleton() {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.88,
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
    <View className="flex-row flex-wrap px-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} className="w-1/2 p-1.5">
          <View className="bg-white rounded-2xl p-2 border border-[rgba(48,37,34,0.05)]">
            <Animated.View
              className="w-full h-[125px] rounded-xl bg-[#EBDDD6]"
              style={{ opacity: pulse }}
            />
            <Animated.View
              className="w-3/5 h-3.5 rounded-full bg-[#EBDDD6] self-center mt-3 mb-1.5"
              style={{ opacity: pulse }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * CateoryProduct Component
 * Styled with NativeWind
 */
export default function CateoryProduct() {
  const router = useRouter();
  const { isRtl } = useRtl();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetCategories();
  const [refreshing, setRefreshing] = useState(false);

  const categories = Array.isArray(data?.categories)
    ? data.categories
    : Array.isArray(data)
    ? data
    : [];

  const handleCategoryPress = (category) => {
    router.push({
      pathname: "/customer/category/categorylist",
      params: {
        categoryId: category._id,
        name: category.name,
      },
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const renderHeader = () => (
    <View className="px-4 pt-3 pb-3.5">
      <DukanText bold className="text-xl text-text text-right">
        {isRtl ? "جميع الأقسام" : "All Categories"}
      </DukanText>
      <DukanText className="text-xs text-textSecondary text-right mt-1">
        {isRtl
          ? "تصفح أقمشتنا ومنتجاتنا حسب التصنيف"
          : "Browse fabrics and products by category"}
      </DukanText>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return <CategoriesSkeleton />;
    }
    return (
      <View className="py-16 items-center justify-center">
        <Layers size={40} color={Colors.textSecondary} />
        <DukanText className="text-sm text-textSecondary mt-3 text-center">
          {isRtl ? "لا توجد أقسام متوفرة حالياً" : "No categories available"}
        </DukanText>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={categories}
        keyExtractor={(item, index) => item._id || String(index)}
        numColumns={2}
        columnWrapperStyle={{
          flexDirection: isRtl ? "row-reverse" : "row",
          paddingHorizontal: 10,
        }}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <View className="w-1/2 p-1.5">
            <CategoryItem
              category={item}
              onPress={handleCategoryPress}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
}