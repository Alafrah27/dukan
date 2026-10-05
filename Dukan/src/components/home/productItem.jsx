import React, { useState } from "react";
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Tag } from "lucide-react-native";
import DukanText from "../DukanText";
import Colors from "../../constants/Colors";
import { getDiscountedPrice, formatPrice } from "../../utils/offers";

/**
 * ProductItem Component
 *
 * Renders an individual product card adhering to Dukan Design System:
 * - Clean white background (as requested)
 * - Visual image focus with aspect-ratio container
 * - Promotional discount badge (calculated dynamically from active offers)
 * - Category metadata and primary product title
 * - Clear pricing with strikethrough for discounted items
 * - Quick action add-to-cart button
 */
export default function ProductItem({
  product,
  offer,
  onPress,
  onAddToCart,
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  const imageUri = product.images?.[0]?.trim() || "";
  const categoryName = product.categoryId?.name || "";

  // Discount calculation
  const discountedPrice = getDiscountedPrice(product.basePrice, offer);
  const hasDiscount = discountedPrice !== null && discountedPrice < product.basePrice;
  const finalPrice = hasDiscount ? discountedPrice : product.basePrice;

  // Format discount badge label
  let discountBadgeLabel = "";
  if (hasDiscount && offer) {
    if (offer.type === "fixed") {
      discountBadgeLabel = `خصم ${offer.value} ر.س`;
    } else {
      discountBadgeLabel = `خصم ${Math.round(offer.value)}%`;
    }
  }

  const handlePress = () => {
    onPress?.(product);
  };

  const handleAddPress = (e) => {
    e?.stopPropagation?.();
    onAddToCart?.(product);
  };

  return (
    <Pressable
      activeOpacity={0.88}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={product.name}
    >
      {/* ─── Product Image Container ─── */}
      <View style={styles.imageContainer}>
        {imageUri && !imageError ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
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
            <Tag size={28} color={Colors.textSecondary} />
          </View>
        )}

        {/* Loading Indicator */}
        {imageLoading && !imageError && (
          <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <DukanText bold className="text-[10px] text-white">
              {discountBadgeLabel}
            </DukanText>
          </View>
        )}
      </View>

      {/* ─── Product Information ─── */}
      <View style={styles.infoContainer}>
        {/* Category Tag / Metadata */}
        {Boolean(categoryName) && (
          <DukanText
            numberOfLines={1}
            className="text-[11px] text-textSecondary text-right"
          >
            {categoryName}
          </DukanText>
        )}

        {/* Product Name */}
        <DukanText
          bold
          numberOfLines={1}
          className="text-sm text-text text-right mt-0.5"
        >
          {product.name}
        </DukanText>

        {/* ─── Price ─── */}
        <View style={styles.priceRow}>
          <DukanText bold className="text-sm text-primary text-right">
            {formatPrice(finalPrice)} ر.س
          </DukanText>
          {hasDiscount && (
            <DukanText className="text-[11px] text-textSecondary line-through text-right mr-1.5">
              {formatPrice(product.basePrice)} ر.س
            </DukanText>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF", // Explicit white background as requested
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(48, 37, 34, 0.06)",
    ...Platform.select({
      ios: {
        shadowColor: "#302522",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 3px 10px rgba(48, 37, 34, 0.06)",
      },
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.975 }],
    opacity: 0.94,
  },
  imageContainer: {
    width: "100%",
    height: 145,
    backgroundColor: "#FFFFFF",
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallbackContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  infoContainer: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  priceRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(48, 37, 34, 0.04)",
  },
});