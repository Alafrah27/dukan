import React, { useState } from "react";
import {
  View,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Layers } from "lucide-react-native";
import DukanText from "../DukanText";
import Colors from "../../constants/Colors";

/**
 * CategoryItem Component
 *
 * Styled using NativeWind:
 * - Pure white background (bg-white) across card and image containers
 * - Prominent image preview with smooth loading indicator and graceful fallback
 * - Category title in bold typography
 * - Responsive press feedback
 */
export default function CategoryItem({ category, onPress }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!category) return null;

  const imageUrl = category?.image?.trim() || "";

  return (
    <Pressable
      activeOpacity={0.88}
      onPress={() => onPress?.(category)}
      className="bg-white rounded-2xl overflow-hidden border border-[rgba(48,37,34,0.06)] p-2 active:opacity-90 shadow-sm"
      accessibilityRole="button"
      accessibilityLabel={category.name}
    >
      {/* Category Image Box */}
      <View className="w-full h-[125px] rounded-xl overflow-hidden bg-white relative">
        {imageUrl && !imageError ? (
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
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
          <View className="w-full h-full items-center justify-center bg-white">
            <Layers size={32} color={Colors.primary} />
          </View>
        )}

        {/* Loading Indicator */}
        {imageLoading && !imageError && (
          <View className="absolute inset-0 items-center justify-center bg-white/70">
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
      </View>

      {/* Category Name */}
      <View className="pt-2.5 pb-1 items-center bg-white">
        <DukanText
          bold
          numberOfLines={1}
          className="text-sm text-text text-center"
        >
          {category.name}
        </DukanText>
      </View>
    </Pressable>
  );
}
