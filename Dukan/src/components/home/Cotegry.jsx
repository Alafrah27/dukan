import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  Pressable,
  FlatList,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react-native";
import DukanText from "../DukanText";
import Colors from "../../constants/Colors";
import { useGetCategories } from "../../store/categoryQuery";
import useRtl from "../../hooks/useRtl";

/**
 * Skeleton loader for category items during data fetching
 */
function CategorySkeleton() {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.skeletonRow}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.skeletonItem}>
          <Animated.View style={[styles.skeletonCircle, { opacity: pulse }]} />
          <Animated.View style={[styles.skeletonText, { opacity: pulse }]} />
        </View>
      ))}
    </View>
  );
}

/**
 * Single Category Card Item
 */
function CategoryCard({ category, isSelected, onPress }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const imageUrl = category?.image?.trim() || "";

  return (
    <Pressable
      activeOpacity={0.82}
      onPress={() => onPress?.(category)}
      style={({ pressed }) => [
        styles.categoryItem,
        pressed && styles.categoryItemPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={category.name}
    >
      <View
        style={[
          styles.imageContainer,
          isSelected && styles.imageContainerSelected,
        ]}
      >
        {imageUrl && !imageError ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.categoryImage}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoad={() => setImageLoading(false)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <Layers size={26} color={Colors.primary} />
          </View>
        )}

        {imageLoading && !imageError && (
          <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
      </View>

      <DukanText
        medium
        numberOfLines={1}
        className={`text-xs text-center mt-2 max-w-[76px] ${
          isSelected ? "text-primary font-bold" : "text-text"
        }`}
      >
        {category.name}
      </DukanText>
    </Pressable>
  );
}

/**
 * Home Screen Category Component
 *
 * Displays storefront product categories using a horizontal FlatList
 * with pagination support, responsive layout, skeleton loaders, and touch animations.
 */
export default function Cotegry({
  categories: propCategories,
  selectedCategoryId,
  onSelectCategory,
  onViewAll,
  onEndReached,
  isFetchingNextPage = false,
  title = "الأقسام",
}) {
  const router = useRouter();
  const { isRtl } = useRtl();
  const { data, isLoading } = useGetCategories();

  const categories =
    propCategories ||
    (Array.isArray(data?.categories)
      ? data.categories
      : Array.isArray(data)
      ? data
      : []);

  const handleCategoryPress = (category) => {
    if (onSelectCategory) {
      onSelectCategory(category);
      return;
    }
    router.push({
      pathname: "/customer/category/category",
      params: { id: category._id, name: category.name },
    });
  };

  const handleViewAllPress = () => {
    if (onViewAll) {
      onViewAll();
      return;
    }
    router.push("/customer/category/category");
  };

  return (
    <View style={styles.container}>
      {/* ─── Header: Title & "عرض الكل" ─── */}
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

      {/* ─── Body: Loading Skeleton or Categories FlatList ─── */}
      {isLoading && (!propCategories || propCategories.length === 0) ? (
        <CategorySkeleton />
      ) : categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <DukanText className="text-xs text-textSecondary">
            {isRtl ? "لا توجد أقسام حالياً" : "No categories available"}
          </DukanText>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item, index) => item._id || String(index)}
          horizontal
          showsHorizontalScrollIndicator={false}
          inverted={isRtl}
          contentContainerStyle={styles.scrollContent}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              isSelected={selectedCategoryId === item._id}
              onPress={handleCategoryPress}
            />
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.paginationLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerRow: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  viewAllButton: {
    alignItems: "center",
    gap: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: "center",
    width: 74,
  },
  categoryItemPressed: {
    transform: [{ scale: 0.94 }],
  },
  imageContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: "rgba(168, 79, 53, 0.08)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#302522",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      web: {
        boxShadow: "0 3px 8px rgba(48, 37, 34, 0.07)",
      },
    }),
  },
  imageContainerSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.surfaceSelected,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  fallbackContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  skeletonRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
  },
  skeletonItem: {
    alignItems: "center",
    width: 74,
  },
  skeletonCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EBDDD6",
  },
  skeletonText: {
    width: 52,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EBDDD6",
    marginTop: 8,
  },
  paginationLoader: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
});
