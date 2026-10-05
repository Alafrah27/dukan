import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Animated,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  Share,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowRight,
  ShoppingBag,
  Scissors,
  Package,
  Ruler,
  Check,
  Plus,
  Minus,
  Share2,
  Heart,
  Layers,
  Zap,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import DukanText from "../components/DukanText";
import Colors from "../constants/Colors";
import useRtl from "../hooks/useRtl";
import { useGetProductById } from "../store/productQuery";
import {
  useGetProductTailoringPrices,
  useGetGlobalTailoringPrices,
} from "../store/tailoringQuery";
import { useGetActiveOffers } from "../store/offerQuery";
import { useAddToCart } from "../store/cartQuery";
import { buildOfferMap, getDiscountedPrice, formatPrice } from "../utils/offers";

const SIZE_LABELS = {
  child: { ar: "طفل (Child)", shortAr: "طفل", en: "Child" },
  adult: { ar: "بالغ (Adult)", shortAr: "بالغ", en: "Adult" },
};

/**
 * Safely parse sizes / colors from array, JSON string, or comma-separated string
 */
const parseArrayField = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .flatMap((item) => {
        if (typeof item === "string" && item.trim().startsWith("[")) {
          try {
            const parsed = JSON.parse(item);
            return Array.isArray(parsed) ? parsed : [item];
          } catch {
            return [item];
          }
        }
        return [item];
      })
      .map((s) => (typeof s === "string" ? s.trim() : s))
      .filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      return [raw.trim()];
    } catch {
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const DEFAULT_PURCHASE_OPTIONS = [
  {
    key: "farbic_only",
    label: "شراء القطعة فقط",
    requiremasurment: false,
  },
  {
    key: "farbic_with_stiching",
    label: "شراء القطعة مع خياطة",
    requiremasurment: true,
  },
];

export default function ProductDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const productId = Array.isArray(id) ? id[0] : id;

  const insets = useSafeAreaInsets();
  const { isRtl, row } = useRtl();
  const { width: windowWidth } = useWindowDimensions();

  const HEADER_HEIGHT = Math.min(windowWidth * 1.1, 420);

  // Parallax Animated Scroll
  const scrollY = useRef(new Animated.Value(0)).current;

  // Data Queries
  const {
    data: productData,
    isLoading: isProductLoading,
    isError: isProductError,
    refetch: refetchProduct,
  } = useGetProductById(productId);

  const product = productData?.product || productData;

  const { data: tailoringData } = useGetProductTailoringPrices(productId);
  const { data: globalTailoringData } = useGetGlobalTailoringPrices();

  // Combine product tailoring prices and fallback to global tailoring prices
  const tailoringPrices = useMemo(() => {
    const specific = tailoringData?.tailoringPrices || [];
    if (specific.length > 0) return specific;
    return globalTailoringData?.tailoringPrices || [];
  }, [tailoringData?.tailoringPrices, globalTailoringData?.tailoringPrices]);

  // Active offers
  const { data: offersData } = useGetActiveOffers();
  const offerMap = useMemo(
    () => buildOfferMap(offersData?.offers || []),
    [offersData?.offers]
  );
  const offer = product?._id ? offerMap[product._id] : null;

  // Add to cart mutation
  const { mutate: addToCartMutation, isPending: isAddingToCart } = useAddToCart();

  // Local Form State
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedPurchaseOption, setSelectedPurchaseOption] = useState(null);
  const [selectedTailoringSizeType, setSelectedTailoringSizeType] =
    useState(null);
  const [measurements, setMeasurements] = useState({});
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  // Available product sizes & colors from Product document in MongoDB (with graceful fallbacks)
  const availableSizes = useMemo(() => {
    const parsed = parseArrayField(product?.sizes);
    if (parsed.length > 0) return parsed;

    // Graceful fallback sizes so sizes ALWAYS show on product details:
    const nameLower = (product?.name || "").toLowerCase();
    const catLower = (product?.categoryId?.name || "").toLowerCase();
    if (nameLower.includes("سديري") || catLower.includes("سديري")) {
      return ["2 متر (مناسب للأطفال)", "2.5 متر", "3 متر (مناسب للكبار)"];
    }
    if (nameLower.includes("قماش") || catLower.includes("قماش") || catLower.includes("جلاليب")) {
      return ["2 متر (مناسب للأطفال)", "3 متر (مناسب للكبار)", "3.5 متر"];
    }
    return ["صغير (S)", "متوسط (M)", "كبير (L)", "كبير جداً (XL)"];
  }, [product?.sizes, product?.name, product?.categoryId?.name]);

  const availableColors = useMemo(() => {
    return parseArrayField(product?.colors);
  }, [product?.colors]);

  const [selectedProductSize, setSelectedProductSize] = useState(null);
  const [selectedProductColor, setSelectedProductColor] = useState(null);

  // Dynamic tailoring sizes (extracting configured sizes and prices from database)
  const fullTailoringSizes = useMemo(() => {
    const list = [];
    const seen = new Set();

    tailoringPrices.forEach((doc) => {
      if (doc.isActive === false) return;

      if (Array.isArray(doc.sizeType) && doc.sizeType.length > 0) {
        doc.sizeType.forEach((item) => {
          const typeKey = (item.type || item.sizeType || "").trim().toLowerCase();
          if (typeKey && !seen.has(typeKey)) {
            seen.add(typeKey);
            list.push({
              sizeType: typeKey,
              price: item.price !== undefined ? Number(item.price) : 0,
              _id: doc._id,
            });
          }
        });
      } else if (typeof doc.sizeType === "string" && doc.sizeType.trim()) {
        const typeKey = doc.sizeType.trim().toLowerCase();
        if (!seen.has(typeKey)) {
          seen.add(typeKey);
          list.push({
            sizeType: typeKey,
            price: doc.price !== undefined ? Number(doc.price) : 0,
            _id: doc._id,
          });
        }
      }
    });

    return list;
  }, [tailoringPrices]);

  // Dynamic measurement inputs config from backend with fallback
  const measurementFields = useMemo(() => {
    const raw =
      product?.masurmentConfig?.field ||
      product?.masurmentConfig?.fields ||
      product?.measurementConfig?.field ||
      product?.measurementConfig?.fields;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw;
    }
    return [
      { key: "shoulder_width", label: "عرض الكتف", unit: "cm", require: true },
      { key: "sleeve_length", label: "طول الاكمام", unit: "cm", require: true },
      { key: "length", label: "طول الثوب", unit: "cm", require: true },
    ];
  }, [product?.masurmentConfig, product?.measurementConfig]);

  // Purchase options (use product's options or standard default options)
  const purchaseOptions = useMemo(() => {
    if (Array.isArray(product?.purchaseoption) && product.purchaseoption.length > 0) {
      return product.purchaseoption;
    }
    return DEFAULT_PURCHASE_OPTIONS;
  }, [product?.purchaseoption]);

  const currentOption = useMemo(() => {
    if (selectedPurchaseOption) {
      const found = purchaseOptions.find(
        (opt) => opt.key === selectedPurchaseOption
      );
      if (found) return found;
    }
    return purchaseOptions[0] || null;
  }, [purchaseOptions, selectedPurchaseOption]);

  const activeOptionKey = currentOption?.key || "farbic_only";
  const requiresMeasurement = Boolean(
    currentOption?.requiremasurment || currentOption?.requiresMeasurements
  );

  // Active tailoring record based on selection or first available (e.g. child or adult)
  const activeTailoringRecord = useMemo(() => {
    if (!fullTailoringSizes || fullTailoringSizes.length === 0) return null;
    if (selectedTailoringSizeType) {
      const match = fullTailoringSizes.find(
        (p) => p.sizeType === selectedTailoringSizeType
      );
      if (match) return match;
    }
    // Prefer adult or child or first available
    const adult = fullTailoringSizes.find((s) => s.sizeType === "adult");
    const child = fullTailoringSizes.find((s) => s.sizeType === "child");
    return adult || child || fullTailoringSizes[0];
  }, [fullTailoringSizes, selectedTailoringSizeType]);

  const activeTailoringSizeKey = activeTailoringRecord?.sizeType || null;
  const tailoringPriceAmount = activeTailoringRecord?.price || 0;

  // Price calculation
  const basePrice = Number(product?.basePrice) || 0;
  const discountedPrice = getDiscountedPrice(basePrice, offer);
  const hasDiscount = discountedPrice !== null && discountedPrice < basePrice;
  const effectiveBasePrice = formatPrice(hasDiscount ? discountedPrice : basePrice);

  const unitPrice = formatPrice(
    effectiveBasePrice + (requiresMeasurement ? tailoringPriceAmount : 0)
  );
  const totalPrice = formatPrice(unitPrice * quantity);

  // Parallax Interpolations
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
    outputRange: [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.38],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0],
    outputRange: [1.6, 1],
    extrapolateRight: "clamp",
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.7, HEADER_HEIGHT],
    outputRange: [1, 0.7, 0.2],
    extrapolate: "clamp",
  });

  const navBackgroundOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT - 120, HEADER_HEIGHT - 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const navTitleOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT - 70, HEADER_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Share handler
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product?.name || "دكان"} - متجر الأقمشة والخياطة`,
        title: product?.name,
      });
    } catch {
      // Ignored
    }
  };

  // Quantity helpers
  const handleIncreaseQty = useCallback(() => {
    setQuantity((prev) => prev + 1);
  }, []);

  const handleDecreaseQty = useCallback(() => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  }, []);

  // Measurement update helpers
  const handleMeasurementChange = (key, text) => {
    const num = parseFloat(text);
    setMeasurements((prev) => ({
      ...prev,
      [key]: isNaN(num) ? "" : num,
    }));
  };

  const handleStepMeasurement = (key, delta, defaultVal = 50) => {
    setMeasurements((prev) => {
      const current = typeof prev[key] === "number" ? prev[key] : defaultVal;
      const nextVal = Math.max(1, current + delta);
      return { ...prev, [key]: nextVal };
    });
  };

  // Core Add to Cart logic with support for Direct Purchase (Buy Now)
  const executeAddToCart = (isBuyNow = false) => {
    if (!product?._id) return;

    if (!product.isAvailable) {
      Toast.show({
        type: "error",
        text1: isRtl ? "المنتج غير متوفر حالياً" : "Product is not available",
        position: "bottom",
      });
      return;
    }

    // Measurement validation if tailored option selected
    if (requiresMeasurement) {
      for (const field of measurementFields) {
        if (field.require) {
          const val = measurements[field.key];
          if (val === undefined || val === "" || Number(val) <= 0) {
            Toast.show({
              type: "error",
              text1: isRtl ? "يرجى إدخال المقاسات المطلوبة" : "Measurements required",
              text2: `${field.label || field.key}`,
              position: "bottom",
            });
            return;
          }
        }
      }
    }

    if (isBuyNow) setIsBuyingNow(true);

    const chosenSize = selectedProductSize || availableSizes[0];
    const chosenColor = selectedProductColor || availableColors[0];
    const metaParts = [];
    if (chosenSize) metaParts.push(`المقاس: ${chosenSize}`);
    if (chosenColor) metaParts.push(`اللون: ${chosenColor}`);

    let customerNote = note.trim();
    let combinedNote = metaParts.length > 0 ? metaParts.join(" | ") : "";
    if (customerNote) {
      combinedNote = combinedNote ? `${combinedNote} - ${customerNote}` : customerNote;
    }

    const payload = {
      productId: product._id,
      purchaseOption: activeOptionKey,
      quantity,
    };

    if (combinedNote) {
      payload.note = combinedNote;
    }

    if (requiresMeasurement) {
      if (activeTailoringSizeKey) {
        payload.tailoringSizeType = activeTailoringSizeKey;
      }
      payload.measurements = measurements;
    }

    addToCartMutation(payload, {
      onSuccess: () => {
        setIsBuyingNow(false);
        if (isBuyNow) {
          router.push("/customer/cart");
        } else {
          Toast.show({
            type: "success",
            text1: isRtl ? "تمت الإضافة إلى السلة" : "Added to cart",
            text2: product.name,
            position: "bottom",
            visibilityTime: 2500,
          });
        }
      },
      onError: (err) => {
        setIsBuyingNow(false);
        const errorMsg =
          err?.response?.data?.error ||
          (isRtl ? "تعذر إضافة المنتج إلى السلة" : "Failed to add to cart");
        Toast.show({
          type: "error",
          text1: isRtl ? "تنبيه" : "Error",
          text2: errorMsg,
          position: "bottom",
          visibilityTime: 3000,
        });
      },
    });
  };

  // Loading skeleton state
  if (isProductLoading || (!product && !isProductError)) {
    return (
      <View className="flex-1 bg-background">
        <View style={{ height: HEADER_HEIGHT }} className="w-full bg-[#EBDDD6]" />
        <View className="p-5 gap-4">
          <View className="w-2/5 h-4 bg-[#EBDDD6] rounded-md" />
          <View className="w-3/4 h-7 bg-[#EBDDD6] rounded-lg" />
          <View className="w-1/3 h-6 bg-[#EBDDD6] rounded-md" />
          <View className="w-full h-24 bg-white rounded-2xl p-4 mt-2" />
        </View>
      </View>
    );
  }

  // Error state
  if (isProductError || !product) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Layers size={54} color={Colors.textSecondary} />
        <DukanText bold className="text-lg text-text text-center mt-4">
          {isRtl ? "تعذر العثور على المنتج" : "Product Not Found"}
        </DukanText>
        <DukanText className="text-xs text-textSecondary text-center mt-2">
          {isRtl
            ? "قد يكون المنتج غير متاح أو تم نقله."
            : "The product might be unavailable or removed."}
        </DukanText>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-primary px-6 py-3 rounded-xl active:opacity-90"
        >
          <DukanText bold className="text-sm text-white">
            {isRtl ? "العودة للخلف" : "Go Back"}
          </DukanText>
        </Pressable>
      </View>
    );
  }

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [];
  const currentImage = images[selectedImageIndex] || images[0] || "";

  return (
    <View className="flex-1 bg-background">
      {/* ─── STICKY PARALLAX IMAGE HEADER (pointerEvents="none" so touches pass directly to ScrollView) ─── */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_HEIGHT,
          transform: [
            { translateY: imageTranslateY },
            { scale: imageScale },
          ],
          opacity: imageOpacity,
          zIndex: 1,
        }}
      >
        {currentImage ? (
          <Image
            source={{ uri: currentImage }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-[#EBDDD6] items-center justify-center">
            <Package size={56} color={Colors.primary} />
          </View>
        )}

        {/* Multiple Images Dots Indicator */}
        {images.length > 1 && (
          <View className="absolute bottom-8 self-center flex-row gap-1.5 bg-black/35 px-3 py-1.5 rounded-full">
            {images.map((_, idx) => (
              <View
                key={idx}
                className={`w-2 h-2 rounded-full ${idx === selectedImageIndex ? "bg-white w-4" : "bg-white/50"
                  }`}
              />
            ))}
          </View>
        )}
      </Animated.View>

      {/* ─── STICKY TOP NAVIGATION BAR (zIndex: 50, pointerEvents="box-none") ─── */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: 10,
          paddingHorizontal: 16,
          zIndex: 50,
        }}
      >
        {/* Animated Solid Background */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#FFFFFF",
            opacity: navBackgroundOpacity,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(48, 37, 34, 0.06)",
          }}
        />

        <View
          className="items-center justify-between"
          style={{ flexDirection: row }}
        >
          {/* Back Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isRtl ? "رجوع" : "Back"}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 rounded-full bg-white/95 items-center justify-center shadow-sm active:scale-95"
          >
            <ArrowRight
              size={20}
              color={Colors.text}
              style={{ transform: [{ scaleX: isRtl ? 1 : -1 }] }}
            />
          </Pressable>

          {/* Scrolled Title */}
          <Animated.View
            pointerEvents="none"
            className="flex-1 px-3 items-center justify-center"
            style={{ opacity: navTitleOpacity }}
          >
            <DukanText
              bold
              numberOfLines={1}
              className="text-base text-text text-center"
            >
              {product.name}
            </DukanText>
          </Animated.View>

          {/* Action Buttons: Favorite & Share */}
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="المفضلة"
              onPress={() => setIsFavorite((prev) => !prev)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-10 h-10 rounded-full bg-white/95 items-center justify-center shadow-sm active:scale-95"
            >
              <Heart
                size={18}
                color={isFavorite ? "#E11D48" : Colors.text}
                fill={isFavorite ? "#E11D48" : "transparent"}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="مشاركة"
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-10 h-10 rounded-full bg-white/95 items-center justify-center shadow-sm active:scale-95"
            >
              <Share2 size={18} color={Colors.text} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ─── SCROLLABLE CONTENT (zIndex: 10, receives full touch & scroll gestures) ─── */}
      <Animated.ScrollView
        style={{ flex: 1, zIndex: 10 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 120,
        }}
      >
        {/* Transparent Spacer matching header height */}
        <View style={{ height: HEADER_HEIGHT - 24 }} />

        {/* ─── MAIN PRODUCT CARD SLIDING OVER PARALLAX HEADER (NO shadow to avoid dark shadow on image) ─── */}
        <View
          style={{ zIndex: 10 }}
          className="bg-background rounded-t-[32px] pt-8 px-5 min-h-screen"
        >
          {/* Multiple Image Thumbnails if more than 1 image */}
          {images.length > 1 && (
            <View className="flex-row gap-2 mb-5 justify-center">
              {images.map((img, i) => (
                <Pressable
                  key={i}
                  onPress={() => setSelectedImageIndex(i)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 ${i === selectedImageIndex
                      ? "border-primary"
                      : "border-transparent opacity-60"
                    }`}
                >
                  <Image
                    source={{ uri: img }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </View>
          )}

          {/* Category Tag & Availability Status */}
          <View
            className="items-center justify-between mb-3"
            style={{ flexDirection: row }}
          >
            {product.categoryId?.name ? (
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <DukanText medium className="text-xs text-primary">
                  {product.categoryId.name}
                </DukanText>
              </View>
            ) : <View />}

            <View
              className={`px-3 py-1 rounded-full ${product.isAvailable ? "bg-green-100" : "bg-red-100"
                }`}
            >
              <DukanText
                medium
                className={`text-[11px] ${product.isAvailable ? "text-green-700" : "text-red-700"
                  }`}
              >
                {product.isAvailable
                  ? isRtl
                    ? "متوفر في المخزون"
                    : "In Stock"
                  : isRtl
                    ? "غير متوفر"
                    : "Out of Stock"}
              </DukanText>
            </View>
          </View>

          {/* Product Name (Generous top padding for text as requested) */}
          <View className="pt-2 pb-1">
            <DukanText
              bold
              className="text-2xl text-text leading-9 text-right"
            >
              {product.name}
            </DukanText>
          </View>

          {/* Price Breakdown */}
          <View
            className="items-baseline gap-2 mt-3 pb-2"
            style={{ flexDirection: row }}
          >
            <DukanText bold className="text-2xl text-primary text-right">
              {formatPrice(effectiveBasePrice)} ر.س
            </DukanText>

            {hasDiscount && (
              <DukanText className="text-sm text-textSecondary line-through text-right">
                {formatPrice(product.basePrice)} ر.س
              </DukanText>
            )}

            {hasDiscount && offer && (
              <View className="bg-primary px-2.5 py-0.5 rounded-md self-center">
                <DukanText bold className="text-[10px] text-white">
                  {offer.type === "fixed"
                    ? `خصم ${offer.value} ر.س`
                    : `خصم ${Math.round(offer.value)}%`}
                </DukanText>
              </View>
            )}
          </View>

          {/* Description */}
          {Boolean(product.description) && (
            <View className="mt-4 bg-white rounded-2xl p-4 border border-[rgba(48,37,34,0.05)]">
              <DukanText bold className="text-sm text-text text-right mb-1.5">
                {isRtl ? "تفاصيل المنتج" : "Product Details"}
              </DukanText>
              <DukanText className="text-xs text-textSecondary text-right leading-5">
                {product.description}
              </DukanText>
            </View>
          )}

          {/* ─── AVAILABLE SIZES (المقاسات المتوفرة للمنتج) ─── */}
          {availableSizes.length > 0 && (
            <View className="mt-5 bg-white rounded-2xl p-4 border border-[rgba(48,37,34,0.06)]">
              <View
                className="items-center justify-between mb-3"
                style={{ flexDirection: row }}
              >
                <View className="items-center gap-2" style={{ flexDirection: row }}>
                  <Layers size={17} color={Colors.primary} />
                  <DukanText bold className="text-sm text-text text-right">
                    {isRtl ? "المقاسات المتوفرة" : "Available Sizes"}
                  </DukanText>
                </View>
                {Boolean(selectedProductSize || availableSizes[0]) && (
                  <View className="bg-primary/10 px-2.5 py-0.5 rounded-full">
                    <DukanText bold className="text-[11px] text-primary">
                      {selectedProductSize || availableSizes[0]}
                    </DukanText>
                  </View>
                )}
              </View>

              {/* Bug-free wrapping container (never uses row-reverse with wrap) */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: isRtl ? "flex-end" : "flex-start",
                  gap: 8,
                }}
              >
                {availableSizes.map((sizeOption, idx) => {
                  const isSelected =
                    (selectedProductSize || availableSizes[0]) === sizeOption;
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => setSelectedProductSize(sizeOption)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                      className={`px-4 py-2.5 rounded-xl border ${isSelected
                          ? "bg-primary border-primary shadow-xs"
                          : "bg-surface/40 border-[rgba(48,37,34,0.1)]"
                        }`}
                    >
                      <DukanText
                        bold={isSelected}
                        className={`text-xs ${isSelected ? "text-white" : "text-text"
                          } text-center`}
                      >
                        {sizeOption}
                      </DukanText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ─── AVAILABLE COLORS (الألوان المتوفرة للمنتج) ─── */}
          {availableColors.length > 0 && (
            <View className="mt-4 bg-white rounded-2xl p-4 border border-[rgba(48,37,34,0.06)]">
              <View
                className="items-center justify-between mb-3"
                style={{ flexDirection: row }}
              >
                <DukanText bold className="text-sm text-text text-right">
                  {isRtl ? "الألوان المتوفرة" : "Available Colors"}
                </DukanText>
                {Boolean(selectedProductColor || availableColors[0]) && (
                  <View className="bg-primary/10 px-2.5 py-0.5 rounded-full">
                    <DukanText bold className="text-[11px] text-primary">
                      {selectedProductColor || availableColors[0]}
                    </DukanText>
                  </View>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: isRtl ? "flex-end" : "flex-start",
                  gap: 8,
                }}
              >
                {availableColors.map((colorOption, idx) => {
                  const isSelected =
                    (selectedProductColor || availableColors[0]) === colorOption;
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => setSelectedProductColor(colorOption)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                      className={`px-4 py-2.5 rounded-xl border ${isSelected
                          ? "bg-primary border-primary shadow-xs"
                          : "bg-surface/40 border-[rgba(48,37,34,0.1)]"
                        }`}
                    >
                      <DukanText
                        bold={isSelected}
                        className={`text-xs ${isSelected ? "text-white" : "text-text"
                          } text-center`}
                      >
                        {colorOption}
                      </DukanText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ─── PURCHASE OPTIONS (FABRIC ONLY VS TAILORED) ─── */}
          <View className="mt-6">
            <DukanText bold className="text-base text-text text-right mb-3">
              {isRtl ? "خيارات الشراء" : "Purchase Options"}
            </DukanText>

            <View className="gap-3">
              {purchaseOptions.map((opt) => {
                const isSelected = activeOptionKey === opt.key;
                const isTailoring = Boolean(
                  opt.requiremasurment || opt.requiresMeasurements
                );

                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setSelectedPurchaseOption(opt.key)}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    className={`p-4 rounded-2xl border ${isSelected
                        ? "bg-white border-primary"
                        : "bg-white/70 border-[rgba(48,37,34,0.08)]"
                      }`}
                  >
                    <View
                      className="items-center justify-between"
                      style={{ flexDirection: row }}
                    >
                      <View
                        className="items-center gap-3.5"
                        style={{ flexDirection: row }}
                      >
                        <View
                          className={`w-11 h-11 rounded-xl items-center justify-center ${isSelected ? "bg-primary/10" : "bg-gray-100"
                            }`}
                        >
                          {isTailoring ? (
                            <Scissors
                              size={22}
                              color={
                                isSelected ? Colors.primary : Colors.textSecondary
                              }
                            />
                          ) : (
                            <Package
                              size={22}
                              color={
                                isSelected ? Colors.primary : Colors.textSecondary
                              }
                            />
                          )}
                        </View>

                        <View>
                          <DukanText
                            bold={isSelected}
                            className={`text-sm ${isSelected ? "text-primary" : "text-text"
                              } text-right`}
                          >
                            {opt.label}
                          </DukanText>
                          <DukanText className="text-[11px] text-textSecondary text-right mt-0.5">
                            {isTailoring
                              ? isRtl
                                ? "خياطة وتفصيل على مقاساتك بدقة (أدخل مقاساتك)"
                                : "Custom tailored to your measurements"
                              : isRtl
                                ? "استلام القماش فقط دون خياطة"
                                : "Fabric piece only without tailoring"}
                          </DukanText>
                        </View>
                      </View>

                      {/* Radio Check Circle */}
                      <View
                        className={`w-5 h-5 rounded-full items-center justify-center border ${isSelected
                            ? "border-primary bg-primary"
                            : "border-gray-300 bg-white"
                          }`}
                      >
                        {isSelected && <Check size={12} color="#FFFFFF" />}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ─── TAILORING SIZE & MEASUREMENTS SECTION (IF TAILORED) ─── */}
          {requiresMeasurement && (
            <View className="mt-6 bg-white rounded-3xl p-5 border border-[rgba(48,37,34,0.06)]">
              <View
                className="items-center gap-2 mb-3.5"
                style={{ flexDirection: row }}
              >
                <Ruler size={19} color={Colors.primary} />
                <DukanText bold className="text-base text-text text-right">
                  {isRtl ? "مقاسات التفصيل والخياطة" : "Tailoring & Measurements"}
                </DukanText>
              </View>

              {/* Size Category Chips */}
              {fullTailoringSizes.length > 0 && (
                <>
                  <DukanText medium className="text-xs text-textSecondary text-right mb-2">
                    {isRtl ? "اختر فئة المقاس:" : "Select size category:"}
                  </DukanText>

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: isRtl ? "flex-end" : "flex-start",
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    {fullTailoringSizes.map((priceItem) => {
                      const sizeKey = priceItem.sizeType;
                      const isSelected = activeTailoringSizeKey === sizeKey;
                      const sizeConfig = SIZE_LABELS[sizeKey];
                      const sizeLabel =
                        sizeConfig?.[isRtl ? "shortAr" : "en"] ||
                        sizeConfig?.[isRtl ? "ar" : "en"] ||
                        sizeKey;

                      return (
                        <Pressable
                          key={sizeKey}
                          onPress={() => setSelectedTailoringSizeType(sizeKey)}
                          style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                          className={`px-4 py-2.5 rounded-xl border ${isSelected
                              ? "bg-primary border-primary shadow-xs"
                              : "bg-surface/50 border-[rgba(48,37,34,0.08)]"
                            }`}
                        >
                          <DukanText
                            bold={isSelected}
                            className={`text-xs ${isSelected ? "text-white" : "text-text"
                              } text-center`}
                          >
                            {sizeLabel}
                          </DukanText>
                          {priceItem.price !== undefined && (
                            <DukanText
                              bold={isSelected}
                              className={`text-[10px] ${isSelected ? "text-white/90" : "text-primary"
                                } text-center mt-0.5`}
                            >
                              +{formatPrice(priceItem.price)} ر.س
                            </DukanText>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Dynamic Measurement Inputs from backend config */}
              <DukanText medium className="text-xs text-textSecondary text-right mb-2.5">
                {isRtl
                  ? "أدخل مقاساتك بالسنتيمتر (سم):"
                  : "Enter your measurements (cm):"}
              </DukanText>

              <View className="gap-3">
                {measurementFields.map((field) => {
                  const val = measurements[field.key] ?? "";

                  return (
                    <View
                      key={field.key}
                      className="bg-surface/40 rounded-2xl p-3.5 border border-[rgba(48,37,34,0.06)]"
                    >
                      <View
                        className="items-center justify-between mb-2"
                        style={{ flexDirection: row }}
                      >
                        <View className="flex-row items-center gap-1">
                          <DukanText bold className="text-xs text-text text-right">
                            {field.label}
                          </DukanText>
                          {field.require && (
                            <DukanText className="text-xs text-red-500 font-bold">*</DukanText>
                          )}
                        </View>

                        <DukanText className="text-[11px] text-textSecondary">
                          ({field.unit || "سم"})
                        </DukanText>
                      </View>

                      <View
                        className="bg-white rounded-xl border border-[rgba(48,37,34,0.12)] px-3 py-2 items-center justify-between"
                        style={{ flexDirection: row }}
                      >
                        <TextInput
                          keyboardType="numeric"
                          value={val !== "" ? String(val) : ""}
                          onChangeText={(t) =>
                            handleMeasurementChange(field.key, t)
                          }
                          placeholder={
                            isRtl
                              ? `ادخل مقاس ${field.label}`
                              : `Enter ${field.label}`
                          }
                          placeholderTextColor="#A89F9B"
                          className="flex-1 text-xs text-text font-medium text-right p-0"
                        />

                        {/* Quick Adjustment Stepper */}
                        <View
                          className="items-center gap-1.5 pl-2"
                          style={{ flexDirection: row }}
                        >
                          <Pressable
                            onPress={() => handleStepMeasurement(field.key, -1)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                            className="w-7 h-7 rounded-lg bg-surface/60 items-center justify-center border border-[rgba(48,37,34,0.08)]"
                          >
                            <Minus size={14} color={Colors.text} />
                          </Pressable>

                          <Pressable
                            onPress={() => handleStepMeasurement(field.key, 1)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                            className="w-7 h-7 rounded-lg bg-surface/60 items-center justify-center border border-[rgba(48,37,34,0.08)]"
                          >
                            <Plus size={14} color={Colors.text} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Customer Tailoring Notes */}
              <View className="mt-4">
                <DukanText medium className="text-xs text-textSecondary text-right mb-1.5">
                  {isRtl ? "ملاحظات للتفصيل (اختياري):" : "Tailoring Notes (Optional):"}
                </DukanText>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                  placeholder={
                    isRtl
                      ? "اكتب أي تفاصيل إضافية للخياط (مثال: أريد الكم واسع قليلاً)..."
                      : "Any custom instructions for the tailor..."
                  }
                  placeholderTextColor={Colors.textSecondary}
                  className="bg-surface/30 rounded-xl p-3.5 text-xs text-text text-right border border-[rgba(48,37,34,0.06)] min-h-[70px]"
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {/* ─── QUANTITY SELECTOR (With full touch responsiveness) ─── */}
          <View
            className="mt-6 bg-white rounded-2xl p-4 border border-[rgba(48,37,34,0.06)] items-center justify-between"
            style={{ flexDirection: row }}
          >
            <View>
              <DukanText bold className="text-sm text-text text-right">
                {isRtl ? "الكمية المطلوبة" : "Quantity"}
              </DukanText>
              <DukanText className="text-[11px] text-textSecondary text-right mt-0.5">
                {requiresMeasurement
                  ? isRtl
                    ? "عدد القطع بنفس المقاسات المحددة"
                    : "Number of pieces with same measurements"
                  : isRtl
                    ? "عدد القطع المراد شراؤها"
                    : "Number of pieces to purchase"}
              </DukanText>
            </View>

            <View
              className="items-center gap-3 bg-surface/50 px-3 py-1.5 rounded-xl border border-[rgba(48,37,34,0.06)]"
              style={{ flexDirection: row }}
            >
              <Pressable
                onPress={handleDecreaseQty}
                disabled={quantity <= 1}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => [
                  { opacity: pressed || quantity <= 1 ? 0.4 : 1 },
                ]}
                className="w-9 h-9 rounded-lg bg-white items-center justify-center border border-[rgba(48,37,34,0.08)]"
              >
                <Minus size={16} color={Colors.text} />
              </Pressable>

              <View className="min-w-[32px] items-center justify-center">
                <DukanText bold className="text-base text-text text-center">
                  {quantity}
                </DukanText>
              </View>

              <Pressable
                onPress={handleIncreaseQty}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                className="w-9 h-9 rounded-lg bg-white items-center justify-center border border-[rgba(48,37,34,0.08)]"
              >
                <Plus size={16} color={Colors.text} />
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* ─── STICKY BOTTOM ACTION BAR (ALWAYS ACCESSIBLE, zIndex: 40) ─── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 12,
          paddingHorizontal: 16,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "rgba(48, 37, 34, 0.08)",
          zIndex: 40,
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
        }}
      >
        <View
          className="items-center justify-between gap-3"
          style={{ flexDirection: row }}
        >
          {/* Price display with unit breakdown */}
          <View className="items-start">
            <DukanText className="text-[11px] text-textSecondary">
              {isRtl ? "المجموع الكلي" : "Total Price"}
            </DukanText>
            <View
              className="items-baseline gap-1"
              style={{ flexDirection: row }}
            >
              <DukanText bold className="text-xl text-primary">
                {formatPrice(totalPrice)} ر.س
              </DukanText>
              {requiresMeasurement && tailoringPriceAmount > 0 && (
                <DukanText className="text-[10px] text-textSecondary">
                  ({isRtl ? "شامل التفصيل" : "incl. tailoring"})
                </DukanText>
              )}
            </View>
          </View>

          {/* Action Buttons: Add to Cart & Buy Now (شراء الآن) */}
          <View
            className="flex-1 items-center gap-2"
            style={{ flexDirection: row }}
          >


            {/* Primary Buy Button: شراء الآن */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isRtl ? "شراء الآن" : "Buy Now"}
              onPress={() => executeAddToCart(true)}
              disabled={isAddingToCart || !product.isAvailable}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 px-4 rounded-2xl ${!product.isAvailable
                  ? "bg-gray-300"
                  : isAddingToCart && isBuyingNow
                    ? "bg-primary/80"
                    : "bg-primary"
                }`}
            >
              {isAddingToCart && isBuyingNow ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Zap size={18} color="#FFFFFF" />
                  <DukanText bold className="text-sm text-white">
                    {isRtl ? "شراء الآن" : "Buy Now"}
                  </DukanText>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}