import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  Pressable,
  FlatList,
  Animated,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ArrowRight,
  Search as SearchIcon,
  X,
  Clock,
  TrendingUp,
  PackageOpen,
  Filter,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import DukanText from "../components/DukanText";
import Colors from "../constants/Colors";
import useRtl from "../hooks/useRtl";
import ProductItem from "../components/home/productItem";
import { useGetProducts } from "../store/productQuery";
import { useGetCategories } from "../store/categoryQuery";
import { useGetActiveOffers } from "../store/offerQuery";
import { buildOfferMap } from "../utils/offers";

const RECENT_SEARCHES_KEY = "@dukan_recent_searches";
const POPULAR_SEARCHES = [
  "قماش جلاليب",
  "سديري",
  "قماش ابيض",
  "تفصيل رجالي",
  "خياطة",
];

/**
 * Skeleton Loader for search results grid
 */
function SearchSkeleton() {
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
      {Array.from({ length: 4 }).map((_, i) => (
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

export default function SearchScreen() {
  const router = useRouter();
  const { isRtl, row } = useRtl();
  const params = useLocalSearchParams();
  const initialQuery = params.q ? String(params.q) : "";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  const inputRef = useRef(null);

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Load recent searches from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch {
        // Ignored
      }
    })();
  }, []);

  // Save new search query to recent searches
  const saveSearchQuery = useCallback(async (term) => {
    const trimmed = term?.trim();
    if (!trimmed) return;
    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item !== trimmed);
        const updated = [trimmed, ...filtered].slice(0, 8);
        AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(
          () => {}
        );
        return updated;
      });
    } catch {
      // Ignored
    }
  }, []);

  const clearRecentSearches = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch {
      // Ignored
    }
  }, []);

  // Categories for filter pills
  const { data: categoryData } = useGetCategories();
  const categories = useMemo(() => {
    const list = categoryData?.categories || categoryData || [];
    return Array.isArray(list) ? list : [];
  }, [categoryData]);

  // Active offers query for discounts
  const { data: offersData } = useGetActiveOffers();
  const offerMap = useMemo(() => {
    return buildOfferMap(offersData?.offers || []);
  }, [offersData?.offers]);

  // Backend products search query
  const shouldSearch = Boolean(debouncedQuery) || Boolean(selectedCategoryId);
  const {
    data: productsData,
    isLoading: isSearching,
    refetch,
  } = useGetProducts({
    search: debouncedQuery || undefined,
    categoryId: selectedCategoryId || undefined,
    isAvailable: true,
    limit: 30,
  });

  const products = useMemo(() => {
    return productsData?.products || [];
  }, [productsData]);

  const handleSelectKeyword = (keyword) => {
    setQuery(keyword);
    setDebouncedQuery(keyword);
    saveSearchQuery(keyword);
    Keyboard.dismiss();
  };

  const handleProductPress = (product) => {
    saveSearchQuery(product.name);
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

  const handleClearInput = () => {
    setQuery("");
    setDebouncedQuery("");
    inputRef.current?.focus();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* ─── SEARCH HEADER BAR ─── */}
      <View className="px-4 pt-2 pb-3">
        <View
          className="items-center justify-between gap-3"
          style={{ flexDirection: row }}
        >
          {/* Back Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isRtl ? "رجوع" : "Back"}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-[rgba(48,37,34,0.06)] active:scale-95"
          >
            <ArrowRight
              size={20}
              color={Colors.text}
              style={{ transform: [{ scaleX: isRtl ? 1 : -1 }] }}
            />
          </Pressable>

          {/* Search Input Box */}
          <View
            className="flex-1 h-12 bg-white rounded-2xl border border-[rgba(48,37,34,0.08)] px-3.5 items-center gap-2.5"
            style={{ flexDirection: row }}
          >
            <SearchIcon size={18} color={Colors.textSecondary} />

            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => saveSearchQuery(query)}
              returnKeyType="search"
              placeholder={
                isRtl
                  ? "ابحث عن منتج، قماش، تفصيل..."
                  : "Search products, fabrics, tailoring..."
              }
              placeholderTextColor="#9CA3AF"
              autoFocus={!initialQuery}
              className="flex-1 text-sm text-text text-right p-0"
            />

            {/* Clear Button or Search Indicator */}
            {query.length > 0 && (
              <Pressable
                onPress={handleClearInput}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={14} color={Colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* ─── CATEGORY FILTER PILLS ─── */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: isRtl ? "row-reverse" : "row",
              paddingTop: 10,
              gap: 8,
            }}
          >
            {/* All Categories Pill */}
            <Pressable
              onPress={() => setSelectedCategoryId(null)}
              className={`px-3.5 py-1.5 rounded-full border ${
                selectedCategoryId === null
                  ? "bg-primary border-primary"
                  : "bg-white border-[rgba(48,37,34,0.08)]"
              }`}
            >
              <DukanText
                medium
                className={`text-xs ${
                  selectedCategoryId === null ? "text-white" : "text-text"
                }`}
              >
                {isRtl ? "الكل" : "All"}
              </DukanText>
            </Pressable>

            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat._id;
              return (
                <Pressable
                  key={cat._id}
                  onPress={() =>
                    setSelectedCategoryId(isSelected ? null : cat._id)
                  }
                  className={`px-3.5 py-1.5 rounded-full border ${
                    isSelected
                      ? "bg-primary border-primary"
                      : "bg-white border-[rgba(48,37,34,0.08)]"
                  }`}
                >
                  <DukanText
                    medium
                    className={`text-xs ${
                      isSelected ? "text-white" : "text-text"
                    }`}
                  >
                    {cat.name}
                  </DukanText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ─── CONTENT AREA ─── */}
      {isSearching ? (
        <SearchSkeleton />
      ) : shouldSearch ? (
        /* Search Results Grid */
        <FlatList
          data={products}
          keyExtractor={(item, index) => item._id || String(index)}
          numColumns={2}
          columnWrapperStyle={{
            flexDirection: isRtl ? "row-reverse" : "row",
            paddingHorizontal: 10,
          }}
          contentContainerStyle={{
            paddingTop: 6,
            paddingBottom: 28,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View className="px-4 py-2 mb-1">
              <DukanText className="text-xs text-textSecondary text-right">
                {isRtl
                  ? `نتائج البحث (${products.length} منتج)`
                  : `Search Results (${products.length} products)`}
              </DukanText>
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="px-6 py-20 items-center justify-center">
              <View className="w-18 h-18 rounded-full bg-white items-center justify-center p-4 border border-[rgba(48,37,34,0.06)] mb-3">
                <PackageOpen size={44} color={Colors.textSecondary} />
              </View>
              <DukanText bold className="text-base text-text text-center">
                {isRtl ? "لا توجد نتائج مطابقة" : "No Matching Products"}
              </DukanText>
              <DukanText className="text-xs text-textSecondary text-center mt-2 px-8 leading-5">
                {isRtl
                  ? `لم نتمكن من العثور على أي منتج يطابق "${debouncedQuery}". تأكد من كتابة الكلمة بشكل صحيح.`
                  : `We couldn't find any products matching "${debouncedQuery}". Try another keyword.`}
              </DukanText>
            </View>
          )}
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
        />
      ) : (
        /* Initial State: Recent Searches & Popular Suggestions */
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4 pt-3"
        >
          {/* Recent Searches Section */}
          {recentSearches.length > 0 && (
            <View className="mb-6">
              <View
                className="items-center justify-between mb-3"
                style={{ flexDirection: row }}
              >
                <View
                  className="items-center gap-1.5"
                  style={{ flexDirection: row }}
                >
                  <Clock size={16} color={Colors.textSecondary} />
                  <DukanText bold className="text-sm text-text">
                    {isRtl ? "عمليات البحث الأخيرة" : "Recent Searches"}
                  </DukanText>
                </View>

                <Pressable
                  onPress={clearRecentSearches}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <DukanText className="text-xs text-primary">
                    {isRtl ? "مسح الكل" : "Clear All"}
                  </DukanText>
                </Pressable>
              </View>

              <View
                className="flex-row flex-wrap gap-2"
                style={{ flexDirection: isRtl ? "row-reverse" : "row" }}
              >
                {recentSearches.map((term, i) => (
                  <Pressable
                    key={i}
                    onPress={() => handleSelectKeyword(term)}
                    className="flex-row items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[rgba(48,37,34,0.06)] active:opacity-75"
                  >
                    <DukanText className="text-xs text-text">{term}</DukanText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Popular Searches Section */}
          <View className="mb-6">
            <View
              className="items-center gap-1.5 mb-3"
              style={{ flexDirection: row }}
            >
              <TrendingUp size={16} color={Colors.primary} />
              <DukanText bold className="text-sm text-text">
                {isRtl ? "الأكثر بحثاً" : "Popular Searches"}
              </DukanText>
            </View>

            <View
              className="flex-row flex-wrap gap-2"
              style={{ flexDirection: isRtl ? "row-reverse" : "row" }}
            >
              {POPULAR_SEARCHES.map((keyword, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleSelectKeyword(keyword)}
                  className="bg-white px-3.5 py-2 rounded-xl border border-[rgba(48,37,34,0.06)] active:opacity-75"
                >
                  <DukanText className="text-xs text-text">{keyword}</DukanText>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
