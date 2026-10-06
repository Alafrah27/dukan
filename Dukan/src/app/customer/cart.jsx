import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Truck,
  Package,
  MapPin,
  Scissors,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Info,
  ShieldCheck,
  Globe,
  Building2,
  Mail,
  Scale,
  Sparkles,
  ArrowRight,
  Home,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import DukanText from "../../components/DukanText";
import CountryPickerModal from "../../components/customer/CountryPickerModal";
import Colors from "../../constants/Colors";
import Fonts from "../../constants/Fonts";
import {
  useGetShippingCountries,
  getCountryFlag,
  DEFAULT_SHIPPING_COUNTRIES,
} from "../../store/shippingQuery";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
  useCalculateCartShipping,
  useUpdateCartAddress,
} from "../../store/cartQuery";
import { useGetAddresses } from "../../store/addressQuery";

// Standard supported Arab & GCC countries for fast selection
const POPULAR_COUNTRIES = [
  { code: "SA", name: "المملكة العربية السعودية", flag: "🇸🇦" },
  { code: "AE", name: "الإمارات", flag: "🇦🇪" },
  { code: "KW", name: "الكويت", flag: "🇰🇼" },
  { code: "BH", name: "البحرين", flag: "🇧🇭" },
  { code: "QA", name: "قطر", flag: "🇶🇦" },
  { code: "OM", name: "عُمان", flag: "🇴🇲" },
  { code: "EG", name: "مصر", flag: "🇪🇬" },
  { code: "JO", name: "الأردن", flag: "🇯🇴" },
];

export default function CustomerCart() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Queries & Mutations
  const { data: cartData, isLoading: isCartLoading, isFetching: isCartFetching, refetch: refetchCart } =
    useGetCart();
  const { data: addressesData } = useGetAddresses();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();
  const calculateShippingMutation = useCalculateCartShipping();
  const updateCartAddressMutation = useUpdateCartAddress();

  const cart = cartData?.cart;
  const summary = cartData?.summary;
  const items = cart?.items || [];
  const addresses = addressesData?.addresses || [];
  const linkedAddress = cart?.addressId;

  // Aramex Calculator Form State
  // The box size is FIXED from admin: 45 cm
  const FIXED_BOX_SIZE = 45;
  const [kilo, setKilo] = useState("1");
  const [selectedCountryCode, setSelectedCountryCode] = useState("SA");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isAddressesModalOpen, setIsAddressesModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  // Fetch countries list via Aramex lookup (same API as Admin)
  const { data: serverCountries } = useGetShippingCountries();
  const countries = useMemo(() => {
    return serverCountries && serverCountries.length > 0
      ? serverCountries
      : DEFAULT_SHIPPING_COUNTRIES;
  }, [serverCountries]);

  // Identify customer's default address
  const defaultAddress = useMemo(() => {
    return (
      addresses.find((a) => a.isDefault) ||
      (linkedAddress?.isDefault ? linkedAddress : null) ||
      addresses[0] ||
      null
    );
  }, [addresses, linkedAddress]);

  // Find currently selected country metadata
  const selectedCountryObj = useMemo(() => {
    return (
      countries.find(
        (c) => (c.code || "").toUpperCase() === (selectedCountryCode || "").toUpperCase()
      ) || {
        code: selectedCountryCode || "SA",
        nameAr: selectedCountryCode === "SA" ? "المملكة العربية السعودية" : selectedCountryCode,
        nameEn: selectedCountryCode,
      }
    );
  }, [countries, selectedCountryCode]);

  // Check if current selected country matches user's default address country
  const isSelectedDefaultAddressCountry = useMemo(() => {
    if (!defaultAddress?.destination?.country) return false;
    const def = defaultAddress.destination.country.trim().toLowerCase();
    const selCode = (selectedCountryCode || "").toLowerCase();
    const selNameAr = (selectedCountryObj.nameAr || "").toLowerCase();
    return selCode === def || selNameAr === def || (selNameAr && def.includes(selNameAr));
  }, [defaultAddress, selectedCountryCode, selectedCountryObj]);

  // Sync initial calculator values from linked delivery address or cart.aramex
  useEffect(() => {
    if (cart?.aramex?.isCalculated) {
      if (cart.aramex.kilo) setKilo(String(cart.aramex.kilo));
      if (cart.aramex.countryCode) setSelectedCountryCode(cart.aramex.countryCode);
      if (cart.aramex.city) setCity(cart.aramex.city);
      if (cart.aramex.postalCode) setPostalCode(cart.aramex.postalCode);
      return;
    }

    if (linkedAddress?.destination) {
      const dest = linkedAddress.destination;
      if (dest.city && !city) setCity(dest.city);
      if (dest.postalcode && !postalCode) setPostalCode(dest.postalcode);
      if (dest.country) {
        const found = countries.find(
          (c) =>
            c.code.toLowerCase() === dest.country.toLowerCase() ||
            c.nameAr?.includes(dest.country) ||
            dest.country.includes(c.nameAr || "")
        );
        if (found) setSelectedCountryCode(found.code);
      }
    } else if (defaultAddress?.destination) {
      const dest = defaultAddress.destination;
      if (dest.city && !city) setCity(dest.city);
      if (dest.postalcode && !postalCode) setPostalCode(dest.postalcode);
      if (dest.country) {
        const found = countries.find(
          (c) =>
            c.code.toLowerCase() === dest.country.toLowerCase() ||
            c.nameAr?.includes(dest.country) ||
            dest.country.includes(c.nameAr || "")
        );
        if (found) setSelectedCountryCode(found.code);
      }
    }
  }, [linkedAddress, defaultAddress, cart?.aramex, countries]);

  // Handle Quantity Change
  const handleUpdateQuantity = (item, delta) => {
    const currentQty = item.quantity || 1;
    const nextQty = currentQty + delta;
    if (nextQty <= 0) {
      handleRemoveItem(item);
      return;
    }
    updateCartItemMutation.mutate(
      {
        itemId: item._id,
        quantity: nextQty,
      },
      {
        onError: (err) => {
          Toast.show({
            type: "error",
            text1: "خطأ",
            text2: err?.response?.data?.error || "تعذر تعديل الكمية",
            position: "bottom",
          });
        },
      }
    );
  };

  // Handle Remove Item
  const handleRemoveItem = (item) => {
    Alert.alert(
      "حذف المنتج",
      `هل أنت متأكد من حذف "${item.product?.name || "المنتج"}" من السلة؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: () => {
            removeCartItemMutation.mutate(item._id, {
              onSuccess: () => {
                Toast.show({
                  type: "success",
                  text1: "تم الحذف",
                  text2: "تمت إزالة المنتج من السلة",
                  position: "bottom",
                });
              },
              onError: (err) => {
                Toast.show({
                  type: "error",
                  text1: "خطأ",
                  text2: err?.response?.data?.error || "تعذر حذف المنتج",
                  position: "bottom",
                });
              },
            });
          },
        },
      ]
    );
  };

  // Handle Clear Entire Cart
  const handleClearCart = () => {
    if (items.length === 0) return;
    Alert.alert(
      "إفراغ السلة",
      "هل تريد إزالة جميع المنتجات من السلة؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تفريغ السلة",
          style: "destructive",
          onPress: () => {
            clearCartMutation.mutate(undefined, {
              onSuccess: () => {
                Toast.show({
                  type: "success",
                  text1: "تم إفراغ السلة",
                  position: "bottom",
                });
              },
            });
          },
        },
      ]
    );
  };

  // Handle Aramex Shipping Calculation
  const handleCalculateShipping = () => {
    const parsedWeight = parseFloat(kilo);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      Toast.show({
        type: "error",
        text1: "الوزن غير صحيح",
        text2: "يرجى تحديد وزن الشحنة بالكيلو (0.1 كجم على الأقل)",
        position: "bottom",
      });
      return;
    }

    if (!city.trim()) {
      Toast.show({
        type: "error",
        text1: "المدينة مطلوبة",
        text2: "يرجى إدخال اسم المدينة لحساب الشحن",
        position: "bottom",
      });
      return;
    }

    calculateShippingMutation.mutate(
      {
        kilo: parsedWeight,
        countryCode: selectedCountryCode,
        city: city.trim(),
        postalCode: postalCode.trim(),
      },
      {
        onSuccess: (data) => {
          Toast.show({
            type: "success",
            text1: "تم احتساب الشحن عبر أرامكس بنجاح",
            text2: `${data?.aramex?.price || 0} ${data?.aramex?.currency || "SAR"} (مدة التوصيل: ${data?.aramex?.estimatedDays || "15 يوم"})`,
            position: "bottom",
          });
        },
        onError: (err) => {
          Toast.show({
            type: "error",
            text1: "تعذر احتساب سعر الشحن",
            text2: err?.response?.data?.error || "يرجى التحقق من صحة المدينة والرمز البريدي",
            position: "bottom",
          });
        },
      }
    );
  };

  // Quick weight stepper
  const handleWeightStep = (delta) => {
    const current = parseFloat(kilo) || 1;
    const next = Math.max(0.5, current + delta);
    setKilo(next.toFixed(1).replace(/\.0$/, ""));
  };

  // Handle address change from address list
  const handleSelectAddress = (addressId) => {
    updateCartAddressMutation.mutate(addressId, {
      onSuccess: () => {
        setIsAddressesModalOpen(false);
        Toast.show({
          type: "success",
          text1: "تم تحديث عنوان التوصيل",
          position: "bottom",
        });
      },
    });
  };

  // Loading State
  if (isCartLoading && !cartData) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={Colors.primary} />
        <DukanText className="mt-3 text-textSecondary text-sm font-medium">
          جارٍ تحميل سلة التسوق...
        </DukanText>
      </SafeAreaView>
    );
  }

  // Calculated Costs
  const itemsSubtotal = summary?.itemsSubtotal || 0;
  const tailoringTotal = summary?.tailoringTotal || 0;
  const shippingFee = cart?.aramex?.price || 0;
  const isShippingCalculated = Boolean(cart?.aramex?.isCalculated);
  const finalTotal = summary?.finalTotal || itemsSubtotal + tailoringTotal + (isShippingCalculated ? shippingFee : 0);
  const currency = summary?.currency || "ر.س";

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 py-3  ">
        <View className="flex-row items-center gap-2">
         
        </View>

        {items.length > 0 && (
          <TouchableOpacity
            onPress={handleClearCart}
            disabled={clearCartMutation.isPending}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 active:opacity-70"
          >
            <Trash2 size={15} color="#DC2626" />
            <DukanText className="text-xs text-red-600 font-bold">
              إفراغ السلة
            </DukanText>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 90,
        }}
        className="flex-1 px-4 pt-3"
      >
        {/* EMPTY STATE */}
        {items.length === 0 ? (
          <View className="items-center justify-center py-20 px-6">
            <View className="w-24 h-24 rounded-full bg-surface items-center justify-center mb-5 shadow-sm">
              <ShoppingBag size={48} color={Colors.primary} />
            </View>
            <DukanText bold className="text-xl text-text mb-2 text-center">
              سلة التسوق فارغة حالياً
            </DukanText>
            <DukanText className="text-sm text-textSecondary text-center mb-6 leading-6">
              لم تقم بإضافة أي أقمشة أو تفاصيل تفصيل إلى سلتك بعد. استكشف تشكيلاتنا الفاخرة واختر ما يناسبك.
            </DukanText>
            <TouchableOpacity
              onPress={() => router.push("/customer/home")}
              className="bg-primary px-8 py-3.5 rounded-2xl flex-row items-center gap-2 shadow-md active:scale-95"
            >
              <Sparkles size={18} color={Colors.white} />
              <DukanText bold className="text-white text-base">
                تصفح المنتجات الآن
              </DukanText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 1. CART ITEMS LIST */}
            <View className="mb-4">
              <DukanText bold className="text-sm text-textSecondary mb-2 px-1">
                المنتجات المحددة ({items.length})
              </DukanText>

              {items.map((item, index) => {
                const product = item.product || {};
                const imageUri =
                  product.images?.[0]?.url ||
                  product.images?.[0] ||
                  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400";
                const isTailored =
                  item.purchaseOption === "farbic_with_stiching" ||
                  (typeof item.purchaseOption === "string" &&
                    item.purchaseOption.includes("stich"));
                const isChildSize = item.tailoringSizeType === "child";

                return (
                  <View
                    key={item._id || index}
                    className="bg-white rounded-2xl p-3.5 mb-3 border border-surfaceSelected/60 shadow-sm"
                  >
                    <View className="flex-row gap-3">
                      {/* Product Thumbnail */}
                      <Image
                        source={{ uri: imageUri }}
                        className="w-20 h-24 rounded-xl bg-surface"
                        resizeMode="cover"
                      />

                      {/* Item Details */}
                      <View className="flex-1 justify-between">
                        <View>
                          <View className="flex-row items-start justify-between">
                            <DukanText
                              bold
                              numberOfLines={2}
                              className="text-base text-text flex-1 ml-2"
                            >
                              {product.name || "قماش فاخر"}
                            </DukanText>

                            {/* Remove button */}
                            <TouchableOpacity
                              onPress={() => handleRemoveItem(item)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              className="p-1 rounded-lg bg-gray-50 active:opacity-60"
                            >
                              <Trash2 size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                          </View>

                          {/* Purchase Option Badge */}
                          <View className="flex-row flex-wrap items-center gap-1.5 mt-1">
                            <View className="flex-row items-center gap-1 bg-surface px-2 py-0.5 rounded-md">
                              {isTailored ? (
                                <Scissors size={12} color={Colors.primary} />
                              ) : (
                                <Package size={12} color={Colors.textSecondary} />
                              )}
                              <DukanText className="text-[11px] text-text font-medium">
                                {isTailored
                                  ? "شراء القطعة مع خياطة"
                                  : "شراء القطعة فقط"}
                              </DukanText>
                            </View>

                            {/* Tailoring Size Type Badge (child / adult) */}
                            {isTailored && item.tailoringSizeType && (
                              <View
                                className={`px-2 py-0.5 rounded-md ${
                                  isChildSize ? "bg-amber-100" : "bg-blue-100"
                                }`}
                              >
                                <DukanText
                                  bold
                                  className={`text-[11px] ${
                                    isChildSize ? "text-amber-800" : "text-blue-800"
                                  }`}
                                >
                                  تفصيل: {isChildSize ? "طفل (Child)" : "بالغ (Adult)"}
                                </DukanText>
                              </View>
                            )}
                          </View>

                          {/* Note or extra details */}
                          {item.note ? (
                            <DukanText
                              numberOfLines={1}
                              className="text-xs text-textSecondary mt-1"
                            >
                              ملاحظة: {item.note}
                            </DukanText>
                          ) : null}
                        </View>

                        {/* Bottom Row: Price & Quantity Stepper */}
                        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <View>
                            <DukanText bold className="text-base text-primary">
                              {product.basePrice || 0}{" "}
                              <DukanText className="text-xs text-textSecondary">
                                {currency}
                              </DukanText>
                            </DukanText>
                          </View>

                          {/* Quantity Controls */}
                          <View className="flex-row items-center gap-2 bg-surface/60 rounded-xl p-1 border border-surfaceSelected">
                            <TouchableOpacity
                              onPress={() => handleUpdateQuantity(item, -1)}
                              disabled={updateCartItemMutation.isPending}
                              className="w-7 h-7 rounded-lg bg-white items-center justify-center shadow-xs active:bg-gray-100"
                            >
                              <Minus size={14} color={Colors.text} />
                            </TouchableOpacity>

                            <DukanText bold className="text-sm px-2 text-text">
                              {item.quantity || 1}
                            </DukanText>

                            <TouchableOpacity
                              onPress={() => handleUpdateQuantity(item, 1)}
                              disabled={updateCartItemMutation.isPending}
                              className="w-7 h-7 rounded-lg bg-primary items-center justify-center shadow-xs active:opacity-80"
                            >
                              <Plus size={14} color={Colors.white} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 2. DELIVERY ADDRESS CARD */}
            <View className="bg-white rounded-2xl p-4 mb-4 border border-surfaceSelected/60 shadow-sm">
              <View className="flex-row items-center justify-between mb-2.5">
                <View className="flex-row items-center gap-2">
                  <MapPin size={18} color={Colors.primary} />
                  <DukanText bold className="text-sm text-text">
                    عنوان التوصيل
                  </DukanText>
                </View>

                <TouchableOpacity
                  onPress={() => router.push("/address")}
                  className="px-2.5 py-1 rounded-lg bg-surface active:opacity-70"
                >
                  <DukanText bold className="text-xs text-primary">
                    {linkedAddress ? "تغيير العنوان" : "إضافة عنوان"}
                  </DukanText>
                </TouchableOpacity>
              </View>

              {linkedAddress ? (
                <View className="bg-surface/30 rounded-xl p-3 border border-surfaceSelected/40">
                  <View className="flex-row items-center justify-between mb-1">
                    <DukanText bold className="text-sm text-text">
                      {linkedAddress.title || "عنوان الاستلام"}
                    </DukanText>
                    {linkedAddress.recipientName ? (
                      <DukanText className="text-xs text-textSecondary">
                        المستلم: {linkedAddress.recipientName}
                      </DukanText>
                    ) : null}
                  </View>
                  <DukanText className="text-xs text-textSecondary leading-5">
                    {[
                      linkedAddress.destination?.street1,
                      linkedAddress.destination?.district,
                      linkedAddress.destination?.city,
                      linkedAddress.destination?.country,
                      linkedAddress.destination?.postalcode &&
                        `الرمز البريدي: ${linkedAddress.destination?.postalcode}`,
                    ]
                      .filter(Boolean)
                      .join("، ")}
                  </DukanText>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => router.push("/address")}
                  className="border border-dashed border-primary/40 rounded-xl p-3 items-center justify-center bg-primary/5 active:opacity-80"
                >
                  <DukanText bold className="text-xs text-primary">
                    + اضغط هنا لربط أو إنشاء عنوان توصيل
                  </DukanText>
                </TouchableOpacity>
              )}
            </View>

            {/* 3. ARAMEX SHIPPING CALCULATOR (حاسبة شحن أرامكس) */}
            <View className="bg-white rounded-2xl p-4 mb-4 border border-surfaceSelected/60 shadow-sm">
              {/* Card Header with Aramex Branding */}
              <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-lg bg-[#E61E28]/10 items-center justify-center">
                    <Truck size={18} color="#E61E28" />
                  </View>
                  <View>
                    <DukanText bold className="text-sm text-text">
                      حاسبة شحن أرامكس (Aramex)
                    </DukanText>
                    <DukanText className="text-[11px] text-textSecondary">
                      احسب تكلفة ومدة الشحن المباشرة لسلتك
                    </DukanText>
                  </View>
                </View>

                {/* Fixed Box Badge */}
                <View className="flex-row items-center gap-1 bg-surface px-2.5 py-1 rounded-full border border-primary/20">
                  <Package size={12} color={Colors.primary} />
                  <DukanText bold className="text-[11px] text-primary">
                    الصندوق: {FIXED_BOX_SIZE} سم (ثابت)
                  </DukanText>
                </View>
              </View>

              {/* Fixed Dimension Note */}
              <View className="bg-amber-50 rounded-xl p-2.5 mb-3.5 flex-row items-center gap-2 border border-amber-200/50">
                <ShieldCheck size={16} color="#B45309" />
                <DukanText className="text-[11px] text-amber-800 flex-1 leading-4">
                  حجم صندوق الشحن معتمد وثابت من الإدارة ({FIXED_BOX_SIZE}×{FIXED_BOX_SIZE}×{FIXED_BOX_SIZE} سم). يمكنك تغيير الوزن والدولة والمدينة والرمز البريدي فقط.
                </DukanText>
              </View>

              {/* Calculator Inputs: Weight (Kilo), Country, City, Postal Code */}
              <View className="gap-3">
                {/* 1. Weight (Kilo) */}
                <View>
                  <DukanText bold className="text-xs text-textSecondary mb-1.5">
                    الوزن الإجمالي للشحنة (كجم) *
                  </DukanText>
                  <View className="flex-row items-center gap-2">
                    <View className="flex-1 flex-row items-center bg-surface/40 rounded-xl border border-surfaceSelected px-3 py-1.5">
                      <Scale size={16} color={Colors.primary} />
                      <TextInput
                        value={kilo}
                        onChangeText={setKilo}
                        keyboardType="decimal-pad"
                        placeholder="1.0"
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 text-right text-sm font-bold text-text px-2 py-1"
                        style={{ fontFamily: Fonts.Cairo_Bold }}
                      />
                      <DukanText className="text-xs text-textSecondary font-bold">
                        كجم
                      </DukanText>
                    </View>

                    {/* Weight Steppers */}
                    <TouchableOpacity
                      onPress={() => handleWeightStep(-0.5)}
                      className="w-10 h-10 rounded-xl bg-surface items-center justify-center border border-surfaceSelected active:opacity-70"
                    >
                      <Minus size={16} color={Colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleWeightStep(0.5)}
                      className="w-10 h-10 rounded-xl bg-surface items-center justify-center border border-surfaceSelected active:opacity-70"
                    >
                      <Plus size={16} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. Destination Country Selector */}
                <View>
                  <View className="flex-row items-center justify-between mb-1.5">
                    <DukanText bold className="text-xs text-textSecondary">
                      دولة الوجهة *
                    </DukanText>
                    <TouchableOpacity
                      onPress={() => setIsCountryModalOpen(true)}
                      className="flex-row items-center gap-1 active:opacity-70"
                    >
                      <Globe size={13} color={Colors.primary} />
                      <DukanText bold className="text-xs text-primary">
                        عرض جميع الدول ({countries.length})
                      </DukanText>
                    </TouchableOpacity>
                  </View>

                  {/* Selected Country Active Card */}
                  <TouchableOpacity
                    onPress={() => setIsCountryModalOpen(true)}
                    className="flex-row items-center justify-between p-3 rounded-xl bg-surface/30 border border-surfaceSelected active:opacity-80 mb-2.5"
                  >
                    <View className="flex-row items-center gap-2.5 flex-1">
                      <View className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-surfaceSelected/70 shadow-sm">
                        <DukanText className="text-xl">
                          {getCountryFlag(selectedCountryObj.code)}
                        </DukanText>
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 flex-wrap">
                          <DukanText bold className="text-sm text-text">
                            {selectedCountryObj.nameAr || selectedCountryObj.nameEn}
                          </DukanText>

                          <View className="bg-surface px-1.5 py-0.5 rounded">
                            <DukanText bold className="text-[10px] text-textSecondary">
                              {selectedCountryObj.code}
                            </DukanText>
                          </View>

                          {isSelectedDefaultAddressCountry && (
                            <View className="flex-row items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              <Home size={10} color="#059669" />
                              <DukanText bold className="text-[10px] text-emerald-800">
                                عنوانك الافتراضي
                              </DukanText>
                            </View>
                          )}
                        </View>

                        <DukanText className="text-[11px] text-textSecondary mt-0.5">
                          {selectedCountryObj.nameEn || "دولة الشحن المحددة"}
                        </DukanText>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-surfaceSelected shadow-xs">
                      <DukanText bold className="text-xs text-primary">
                        تغيير
                      </DukanText>
                      <ChevronDown size={14} color={Colors.primary} />
                    </View>
                  </TouchableOpacity>

                  {/* Quick-select Popular Chips */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6 }}
                    className="flex-row"
                  >
                    {POPULAR_COUNTRIES.map((country) => {
                      const isSelected = selectedCountryCode === country.code;
                      return (
                        <TouchableOpacity
                          key={country.code}
                          onPress={() => setSelectedCountryCode(country.code)}
                          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "bg-surface/30 border-surfaceSelected/70"
                          }`}
                        >
                          <DukanText className="text-xs">{country.flag}</DukanText>
                          <DukanText
                            bold={isSelected}
                            className={`text-xs ${
                              isSelected ? "text-white" : "text-text"
                            }`}
                          >
                            {country.name}
                          </DukanText>
                        </TouchableOpacity>
                      );
                    })}

                    <TouchableOpacity
                      onPress={() => setIsCountryModalOpen(true)}
                      className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-primary/50 bg-primary/5 active:opacity-75"
                    >
                      <Globe size={13} color={Colors.primary} />
                      <DukanText bold className="text-xs text-primary">
                        + المزيد...
                      </DukanText>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {/* 3. City & Postal Code Inputs */}
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <DukanText bold className="text-xs text-textSecondary mb-1.5">
                      المدينة *
                    </DukanText>
                    <View className="flex-row items-center bg-surface/40 rounded-xl border border-surfaceSelected px-3 py-1">
                      <Building2 size={15} color={Colors.textSecondary} />
                      <TextInput
                        value={city}
                        onChangeText={setCity}
                        placeholder="مثال: الرياض / دبي"
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 text-right text-xs text-text px-2 py-1.5"
                        style={{ fontFamily: Fonts.Cairo_Medium }}
                      />
                    </View>
                  </View>

                  <View className="flex-1">
                    <DukanText bold className="text-xs text-textSecondary mb-1.5">
                      الرمز البريدي (اختياري)
                    </DukanText>
                    <View className="flex-row items-center bg-surface/40 rounded-xl border border-surfaceSelected px-3 py-1">
                      <Mail size={15} color={Colors.textSecondary} />
                      <TextInput
                        value={postalCode}
                        onChangeText={setPostalCode}
                        placeholder="مثال: 11564"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        className="flex-1 text-right text-xs text-text px-2 py-1.5"
                        style={{ fontFamily: Fonts.Cairo_Medium }}
                      />
                    </View>
                  </View>
                </View>

                {/* Calculate Shipping Button */}
                <TouchableOpacity
                  onPress={handleCalculateShipping}
                  disabled={calculateShippingMutation.isPending}
                  className="bg-[#E61E28] rounded-xl py-3 items-center justify-center flex-row gap-2 shadow-sm active:opacity-90 mt-1"
                >
                  {calculateShippingMutation.isPending ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <RefreshCw size={16} color={Colors.white} />
                  )}
                  <DukanText bold className="text-white text-sm">
                    {calculateShippingMutation.isPending
                      ? "جارٍ احتساب الشحن..."
                      : "احتساب تكلفة الشحن (أرامكس)"}
                  </DukanText>
                </TouchableOpacity>

                {/* Calculation Result Feedback */}
                {cart?.aramex?.isCalculated && (
                  <View className="bg-green-50 rounded-xl p-3 border border-green-200 mt-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center gap-1.5">
                        <CheckCircle2 size={16} color="#16A34A" />
                        <DukanText bold className="text-xs text-green-800">
                          {cart.aramex.serviceName || "أرامكس إكسبريس"}
                        </DukanText>
                      </View>
                      <DukanText bold className="text-base text-green-800">
                        {cart.aramex.price || 0} {currency}
                      </DukanText>
                    </View>
                    <DukanText className="text-[11px] text-green-700">
                      مدة التوصيل التقديرية: {cart.aramex.estimatedDays && cart.aramex.estimatedDays.includes("15") ? cart.aramex.estimatedDays : "15 يوم"} • الوجهة: {cart.aramex.city || city} ({cart.aramex.countryCode || selectedCountryCode})
                    </DukanText>
                  </View>
                )}
              </View>
            </View>

            {/* 4. FINAL ORDER COST SUMMARY (ملخص التكلفة النهائية) */}
            <View className="bg-white rounded-2xl p-4 mb-4 border border-surfaceSelected/60 shadow-sm">
              <DukanText bold className="text-sm text-text mb-3">
                ملخص التكلفة الإجمالية
              </DukanText>

              <View className="gap-2.5">
                {/* Items Subtotal */}
                <View className="flex-row items-center justify-between">
                  <DukanText className="text-xs text-textSecondary">
                    مجموع المنتجات ({items.length})
                  </DukanText>
                  <DukanText bold className="text-xs text-text">
                    {itemsSubtotal.toFixed(2)} {currency}
                  </DukanText>
                </View>

                {/* Tailoring Subtotal (if any) */}
                {tailoringTotal > 0 && (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <Scissors size={13} color={Colors.primary} />
                      <DukanText className="text-xs text-textSecondary">
                        رسوم التفصيل والخياطة
                      </DukanText>
                    </View>
                    <DukanText bold className="text-xs text-primary">
                      +{tailoringTotal.toFixed(2)} {currency}
                    </DukanText>
                  </View>
                )}

                {/* Aramex Shipping Fee */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1">
                    <Truck size={13} color="#E61E28" />
                    <DukanText className="text-xs text-textSecondary">
                      شحن أرامكس (صندوق 45 سم)
                    </DukanText>
                  </View>
                  {isShippingCalculated ? (
                    <DukanText bold className="text-xs text-text">
                      +{shippingFee.toFixed(2)} {currency}
                    </DukanText>
                  ) : (
                    <TouchableOpacity onPress={handleCalculateShipping}>
                      <DukanText bold className="text-xs text-amber-600 underline">
                        اضغط لاحتساب الشحن
                      </DukanText>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Divider */}
                <View className="h-px bg-gray-100 my-1" />

                {/* Final Total */}
                <View className="flex-row items-center justify-between pt-1">
                  <View>
                    <DukanText bold className="text-base text-text">
                      المجموع النهائي المطلوب
                    </DukanText>
                    <DukanText className="text-[10px] text-textSecondary">
                      شامل المنتجات {tailoringTotal > 0 ? "+ التفصيل " : ""}{isShippingCalculated ? "+ الشحن" : ""}
                    </DukanText>
                  </View>
                  <DukanText bold className="text-xl text-primary font-bold">
                    {finalTotal.toFixed(2)} {currency}
                  </DukanText>
                </View>
              </View>
            </View>

            {/* 5. CHECKOUT ACTION BUTTON (Only shown after shipping is calculated) */}
            {isShippingCalculated ? (
              <TouchableOpacity
                onPress={() => {
                  if (!linkedAddress) {
                    Toast.show({
                      type: "info",
                      text1: "تنبيه",
                      text2: "يرجى تحديد عنوان التوصيل لإتمام الطلب",
                      position: "bottom",
                    });
                    router.push("/address");
                    return;
                  }
                  Toast.show({
                    type: "success",
                    text1: "متابعة الشراء",
                    text2: `المجموع النهائي: ${finalTotal.toFixed(2)} ${currency}`,
                    position: "bottom",
                  });
                }}
                className="bg-primary rounded-2xl py-4 px-5 flex-row items-center justify-between shadow-lg active:scale-[0.99] mb-4"
              >
                <View>
                  <DukanText className="text-xs text-white/80">المجموع للدفع</DukanText>
                  <DukanText bold className="text-lg text-white">
                    {finalTotal.toFixed(2)} {currency}
                  </DukanText>
                </View>

                <View className="flex-row items-center gap-1.5 bg-white/20 px-4 py-2 rounded-xl">
                  <DukanText bold className="text-white text-sm">
                    إتمام الطلب
                  </DukanText>
                  <ChevronLeft size={18} color={Colors.white} />
                </View>
              </TouchableOpacity>
            ) : (
              <View className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 mb-4 flex-row items-center justify-between shadow-sm">
                <View className="flex-row items-center gap-2.5 flex-1 pl-2">
                  <View className="w-9 h-9 rounded-xl bg-amber-100 items-center justify-center">
                    <Truck size={18} color="#D97706" />
                  </View>
                  <View className="flex-1">
                    <DukanText bold className="text-xs text-amber-900">
                      احتساب الشحن مطلوب للمتابعة
                    </DukanText>
                    <DukanText className="text-[11px] text-amber-700 leading-4">
                      يرجى احتساب تكلفة الشحن أعلاه لإظهار زر إتمام الطلب
                    </DukanText>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleCalculateShipping}
                  disabled={calculateShippingMutation.isPending}
                  className="bg-[#E61E28] px-3.5 py-2.5 rounded-xl flex-row items-center gap-1.5 shadow-xs active:opacity-90"
                >
                  {calculateShippingMutation.isPending ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <RefreshCw size={13} color={Colors.white} />
                  )}
                  <DukanText bold className="text-xs text-white">
                    احسب الآن
                  </DukanText>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Country Picker Modal (Aramex Supported Countries) */}
      <CountryPickerModal
        visible={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCountryCode={selectedCountryCode}
        defaultAddress={defaultAddress}
        onSelect={(country) => {
          setSelectedCountryCode(country.code);
        }}
      />
    </SafeAreaView>
  );
}
