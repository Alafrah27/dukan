import React, { useState, useMemo } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import {
  Search,
  X,
  CheckCircle2,
  Globe,
  Home,
  MapPin,
  Sparkles,
} from "lucide-react-native";
import DukanText from "../DukanText";
import Colors from "../../constants/Colors";
import Fonts from "../../constants/Fonts";
import {
  useGetShippingCountries,
  DEFAULT_SHIPPING_COUNTRIES,
  getCountryFlag,
} from "../../store/shippingQuery";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Helper to normalize Arabic strings for accurate search matching
const normalizeArabic = (text = "") => {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "") // remove tashkeel
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
};

// Friendly labels for Aramex zones
const ZONE_LABELS = {
  gcc: "دول الخليج",
  arab: "دول عربية",
  international: "دولي",
};

export default function CountryPickerModal({
  visible,
  onClose,
  onSelect,
  selectedCountryCode = "SA",
  defaultAddress = null,
  defaultCountryCode = "",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");

  // Fetch countries from Aramex lookup via same API as Admin
  const { data: serverCountries, isLoading, isError } = useGetShippingCountries();

  // Unified countries list
  const countries = useMemo(() => {
    if (serverCountries && serverCountries.length > 0) {
      return serverCountries;
    }
    return DEFAULT_SHIPPING_COUNTRIES;
  }, [serverCountries]);

  // Extract default country indicator from user default address or prop
  const resolvedDefaultCountryString = useMemo(() => {
    if (defaultCountryCode) return defaultCountryCode.trim().toLowerCase();
    const destCountry = defaultAddress?.destination?.country || defaultAddress?.country || "";
    return destCountry.trim().toLowerCase();
  }, [defaultCountryCode, defaultAddress]);

  // Check if a country matches the user's default address country
  const isDefaultCountry = useMemo(() => {
    return (country) => {
      if (!resolvedDefaultCountryString) return false;
      const code = (country.code || "").toLowerCase();
      const iso = (country.isoCode || "").toLowerCase();
      const nameAr = (country.nameAr || "").toLowerCase();
      const nameEn = (country.nameEn || "").toLowerCase();
      const normDef = normalizeArabic(resolvedDefaultCountryString);
      const normNameAr = normalizeArabic(nameAr);

      return (
        code === resolvedDefaultCountryString ||
        iso === resolvedDefaultCountryString ||
        nameAr === resolvedDefaultCountryString ||
        nameEn === resolvedDefaultCountryString ||
        (normDef && normNameAr && (normDef.includes(normNameAr) || normNameAr.includes(normDef))) ||
        (resolvedDefaultCountryString.length === 2 && code === resolvedDefaultCountryString)
      );
    };
  }, [resolvedDefaultCountryString]);

  // Identified default country object
  const defaultCountryItem = useMemo(() => {
    if (!resolvedDefaultCountryString) return null;
    return countries.find((c) => isDefaultCountry(c)) || null;
  }, [countries, isDefaultCountry, resolvedDefaultCountryString]);

  // Filtered countries based on search and zone
  const filteredCountries = useMemo(() => {
    const query = normalizeArabic(searchQuery);

    return countries.filter((country) => {
      // Zone filter
      if (selectedZone !== "all" && country.zone !== selectedZone) {
        return false;
      }

      // Search filter
      if (!query) return true;

      const codeMatch = (country.code || "").toLowerCase().includes(query.toLowerCase());
      const nameEnMatch = (country.nameEn || "").toLowerCase().includes(query.toLowerCase());
      const normNameAr = normalizeArabic(country.nameAr || "");
      const nameArMatch = normNameAr.includes(query);

      return codeMatch || nameEnMatch || nameArMatch;
    });
  }, [countries, searchQuery, selectedZone]);

  const handleSelect = (country) => {
    onSelect?.(country);
    onClose?.();
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <View
          style={{ maxHeight: SCREEN_HEIGHT * 0.88 }}
          className="bg-white rounded-t-3xl pt-3 pb-6 px-4 shadow-2xl"
        >
          {/* Top Handle Bar */}
          <View className="items-center mb-2">
            <View className="w-12 h-1.5 rounded-full bg-gray-300" />
          </View>

          {/* Modal Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
                <Globe size={18} color={Colors.primary} />
              </View>
              <View>
                <DukanText bold className="text-base text-text">
                  اختر دولة الوجهة
                </DukanText>
                <DukanText className="text-[11px] text-textSecondary">
                  اختر الدولة للتحقق من توفر الشحن وسعره
                </DukanText>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center active:opacity-70"
            >
              <X size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Pinned Default Address Country Banner (If detected & no active search) */}
          {defaultCountryItem && !searchQuery && (
            <TouchableOpacity
              onPress={() => handleSelect(defaultCountryItem)}
              className="mb-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex-row items-center justify-between active:opacity-85"
            >
              <View className="flex-row items-center gap-2.5 flex-1">
                <View className="w-8 h-8 rounded-xl bg-emerald-600/10 items-center justify-center">
                  <Home size={16} color="#059669" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <DukanText bold className="text-xs text-emerald-800">
                      دولة عنوانك الافتراضي
                    </DukanText>
                    <View className="bg-emerald-600 px-1.5 py-0.5 rounded-full">
                      <DukanText bold className="text-[9px] text-white">
                        الافتراضي
                      </DukanText>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <DukanText className="text-base">
                      {getCountryFlag(defaultCountryItem.code)}
                    </DukanText>
                    <DukanText bold className="text-xs text-text">
                      {defaultCountryItem.nameAr || defaultCountryItem.nameEn}
                    </DukanText>
                    <DukanText className="text-[11px] text-textSecondary">
                      ({defaultCountryItem.code})
                    </DukanText>
                  </View>
                </View>
              </View>

              <View className="px-3 py-1.5 rounded-xl bg-emerald-600 active:opacity-90">
                <DukanText bold className="text-xs text-white">
                  اختيار
                </DukanText>
              </View>
            </TouchableOpacity>
          )}

          {/* Search Bar */}
          <View className="mb-2.5">
            <View className="flex-row items-center bg-surface/40 rounded-xl border border-surfaceSelected px-3 py-2">
              <Search size={16} color={Colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="ابحث باسم الدولة أو الرمز (مثال: السعودية أو SA)..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-right text-xs text-text px-2 py-0"
                style={{ fontFamily: Fonts.Cairo_Medium }}
                autoCorrect={false}
                clearButtonMode="never"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  className="p-1 rounded-full bg-gray-200"
                >
                  <X size={12} color="#4B5563" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Zone Filter Chips */}
          <View className="flex-row gap-1.5 mb-3">
            {[
              { id: "all", label: "جميع الدول" },
              { id: "gcc", label: "الخليج العربي" },
              { id: "arab", label: "الدول العربية" },
              { id: "international", label: "شحن دولي" },
            ].map((tab) => {
              const isTabActive = selectedZone === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setSelectedZone(tab.id)}
                  className={`px-2.5 py-1 rounded-lg border ${
                    isTabActive
                      ? "bg-primary border-primary"
                      : "bg-surface/30 border-surfaceSelected/70"
                  }`}
                >
                  <DukanText
                    bold={isTabActive}
                    className={`text-[11px] ${
                      isTabActive ? "text-white" : "text-textSecondary"
                    }`}
                  >
                    {tab.label}
                  </DukanText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Loading Indicator */}
          {isLoading && !countries.length ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color={Colors.primary} />
              <DukanText className="mt-2 text-xs text-textSecondary font-medium">
                جارٍ تحميل قائمة الدول...
              </DukanText>
            </View>
          ) : (
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code || item.isoCode || item.nameEn}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
              ListEmptyComponent={
                <View className="py-10 items-center justify-center">
                  <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-2">
                    <Globe size={22} color="#9CA3AF" />
                  </View>
                  <DukanText bold className="text-sm text-text mb-1">
                    لم نجد أي دولة مطابقة
                  </DukanText>
                  <DukanText className="text-xs text-textSecondary text-center">
                    تأكد من كتابة اسم الدولة أو الرمز بشكل صحيح
                  </DukanText>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected =
                  (selectedCountryCode || "").toUpperCase() ===
                  (item.code || "").toUpperCase();
                const isDefault = isDefaultCountry(item);
                const flag = getCountryFlag(item.code);
                const zoneText = ZONE_LABELS[item.zone];

                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    className={`flex-row items-center justify-between p-3 mb-2 rounded-xl border ${
                      isSelected
                        ? "bg-primary/5 border-primary"
                        : isDefault
                        ? "bg-emerald-50/40 border-emerald-200/70"
                        : "bg-white border-surfaceSelected/60"
                    } active:opacity-75`}
                  >
                    {/* Country Details (Flag + Arabic Name + English / Code) */}
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-9 h-9 rounded-xl bg-surface/50 items-center justify-center border border-surfaceSelected">
                        <DukanText className="text-lg">{flag}</DukanText>
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 flex-wrap">
                          <DukanText
                            bold={isSelected || isDefault}
                            className={`text-sm ${
                              isSelected
                                ? "text-primary"
                                : isDefault
                                ? "text-emerald-950"
                                : "text-text"
                            }`}
                          >
                            {item.nameAr || item.nameEn}
                          </DukanText>

                          {/* ISO Code Badge */}
                          <View className="bg-surface px-1.5 py-0.5 rounded">
                            <DukanText bold className="text-[10px] text-textSecondary">
                              {item.code}
                            </DukanText>
                          </View>

                          {/* Default Address Badge */}
                          {isDefault && (
                            <View className="flex-row items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              <Home size={10} color="#059669" />
                              <DukanText
                                bold
                                className="text-[10px] text-emerald-800"
                              >
                                عنوانك الافتراضي
                              </DukanText>
                            </View>
                          )}
                        </View>

                        <View className="flex-row items-center gap-2 mt-0.5">
                          {item.nameEn && item.nameEn !== item.nameAr && (
                            <DukanText className="text-[11px] text-textSecondary">
                              {item.nameEn}
                            </DukanText>
                          )}
                          {zoneText && (
                            <DukanText className="text-[10px] text-textSecondary">
                              • {zoneText}
                            </DukanText>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Selection Indicator */}
                    <View className="mr-1">
                      {isSelected ? (
                        <CheckCircle2 size={20} color={Colors.primary} />
                      ) : (
                        <View className="w-5 h-5 rounded-full border border-gray-300" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
