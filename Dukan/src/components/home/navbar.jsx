import React from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Home, Search, ChevronDown } from "lucide-react-native";
import DukanText from "../DukanText";
import Colors from "../../constants/Colors";
import useDefaultAddress from "../../hooks/useDefaultAddress";

export default function Navbar() {
  const router = useRouter();
  const { city: defaultCity, street: defaultStreet } = useDefaultAddress();

  const city = defaultCity || "الرياض";
  const street = defaultStreet || "أضف عنوان التوصيل";

  return (
    <View className="w-full px-4 pt-2 pb-3 gap-3">
      {/* ─── Top Row: User Address with Home Icon (bg-background) ─── */}
      <Pressable
        activeOpacity={0.8}
        onPress={() => router.push("/address")}
        className="flex-row-reverse items-center justify-between"
      >
        <View className="flex-row-reverse items-center gap-3">
          {/* Home Icon Container with bg-background */}
          <View className="w-[42px] h-[42px] rounded-full bg-white items-center justify-center border border-gray-100">
            <Home size={20} color={Colors.primary} />
          </View>

          {/* City and Street text */}
          <View className="items-end">
            <View className="flex-row-reverse items-center gap-1">
              <DukanText bold className="text-sm text-text">
                {city}
              </DukanText>
              <ChevronDown size={14} color={Colors.primary} />
            </View>
            <DukanText className="text-xs text-textSecondary" numberOfLines={1}>
              {street}
            </DukanText>
          </View>
        </View>
      </Pressable>

      {/* ─── Search Bar Input (Navigates to Search Screen on Click) ─── */}
      <Pressable
        activeOpacity={0.85}
        onPress={() => router.push("/search")}
        className="w-full h-16 bg-white  rounded-xl flex-row-reverse items-center px-3.5 gap-2.5 border border-gray-100"
      >
        <Search size={18} color={Colors.textSecondary} />
        <DukanText className="text-xs text-textSecondary flex-1 text-right">
          ابحث في دكان عن المنتجات، الأقمشة...
        </DukanText>
      </Pressable>
    </View>
  );
}
