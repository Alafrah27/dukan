import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { GoogleMaps, AppleMaps } from "expo-maps";
import {
  ArrowRight,
  ChevronLeft,
  Search,
  Plus,
  MapPin,
  Navigation,
  Home,
  Briefcase,
  MoreVertical,
  Share2,
  CheckCircle2,
  Check,
  X,
  Trash2,
  Edit3,
  Star,
  Phone,
  User,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { Colors } from "../constants/Colors";
import { Fonts } from "../constants/Fonts";
import {
  useGetAddresses,
  useCreateAddress,
  useUpdateAddress,
  useSetDefaultAddress,
  useDeleteAddress,
} from "../store/addressQuery";
import { useUpdateCartAddress } from "../store/cartQuery";
import { useUser } from "@clerk/expo";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Default Riyadh Center Coordinates
const DEFAULT_COORDS = {
  latitude: 24.7136,
  longitude: 46.6753,
};

const MapComponent = Platform.OS === "ios" ? AppleMaps.View : GoogleMaps.View;

export default function AddressScreen() {
  const router = useRouter();
  const { user } = useUser();

  // Queries & Mutations
  const { data, isLoading, refetch } = useGetAddresses();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const setDefaultMutation = useSetDefaultAddress();
  const deleteAddressMutation = useDeleteAddress();
  const updateCartAddressMutation = useUpdateCartAddress();

  const addresses = data?.addresses || [];

  // Screen State
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [selectedAddressForAction, setSelectedAddressForAction] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Map & Location State
  const [centerCoords, setCenterCoords] = useState(DEFAULT_COORDS);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapSearchText, setMapSearchText] = useState("");
  const [locationInfo, setLocationInfo] = useState({
    street1: "شارع ابي بكر الرازي",
    district: "السليمانية",
    city: "الرياض",
    country: "السعودية",
    postalcode: "12231",
    state: "منطقة الرياض",
    displayTitle: "شارع ابي بكر الرازي",
    displaySubtitle: "السليمانية - الرياض - السعودية",
  });

  // Form State
  const [formTitle, setFormTitle] = useState("المنزل");
  const [formRecipient, setFormRecipient] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formCity, setFormCity] = useState("الرياض");
  const [formPostalCode, setFormPostalCode] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);

  const geocodeTimeoutRef = useRef(null);

  // Populate recipient info from user profile
  useEffect(() => {
    if (user) {
      if (!formRecipient) {
        setFormRecipient(user.fullName || user.firstName || "");
      }
      if (!formPhone) {
        setFormPhone(user.primaryPhoneNumber?.phoneNumber || "");
      }
    }
  }, [user]);

  // Filtered addresses
  const filteredAddresses = useMemo(() => {
    if (!searchQuery.trim()) return addresses;
    const q = searchQuery.toLowerCase().trim();
    return addresses.filter((addr) => {
      const dest = addr.destination || {};
      const fullText = `${addr.title || ""} ${addr.recipientName || ""} ${dest.street1 || ""} ${dest.district || ""} ${dest.city || ""} ${addr.phonenumber || ""}`.toLowerCase();
      return fullText.includes(q);
    });
  }, [addresses, searchQuery]);

  // Reverse Geocoding via expo-location
  const reverseGeocode = async (latitude, longitude) => {
    try {
      setIsGeocoding(true);
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const place = results[0];
        const street = place.street || place.name || "شارع غير محدد";
        const district = place.district || place.subregion || "";
        const city = place.city || place.region || "الرياض";
        const country = place.country || "السعودية";
        const postalcode = place.postalCode || "";
        const state = place.region || "";

        setLocationInfo({
          street1: street,
          district: district,
          city: city,
          country: country,
          postalcode: postalcode,
          state: state,
          displayTitle: street,
          displaySubtitle: [district, city, country].filter(Boolean).join(" - "),
        });

        // Prefill form
        setFormStreet(street);
        setFormDistrict(district);
        setFormCity(city);
        setFormPostalCode(postalcode);
      }
    } catch (err) {
      console.warn("Reverse geocoding error:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Debounced Camera Move
  const handleCameraMove = (event) => {
    const coords = event?.coordinates;
    if (coords?.latitude && coords?.longitude) {
      setCenterCoords(coords);
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
      geocodeTimeoutRef.current = setTimeout(() => {
        reverseGeocode(coords.latitude, coords.longitude);
      }, 600);
    }
  };

  // Current Location Button Press
  const handleGetCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "صلاحية الموقع مطلوبة",
          text2: "يرجى منح صلاحية الوصول للموقع الجغرافي لتحديد عنوانك بدقة",
        });
        setIsLocating(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (position?.coords) {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCenterCoords(newCoords);
        await reverseGeocode(newCoords.latitude, newCoords.longitude);
      }
    } catch (error) {
      console.warn("Location error:", error);
      Toast.show({
        type: "error",
        text1: "فشل تحديد الموقع الحالي",
      });
    } finally {
      setIsLocating(false);
    }
  };

  // Open Map Modal
  const handleOpenMapModal = () => {
    setEditingAddressId(null);
    setFormTitle("المنزل");
    setFormIsDefault(addresses.length === 0);
    setIsMapModalVisible(true);
    // Request initial location if not already Riyadh
    handleGetCurrentLocation();
  };

  // Open Details Modal from Map Bottom Card
  const handleProceedToDetails = () => {
    setIsDetailsModalVisible(true);
  };

  // Save Address Submission
  const handleSaveAddress = async () => {
    if (!formStreet.trim()) {
      Toast.show({ type: "error", text1: "يرجى كتابة اسم الشارع أو تفاصيل العنوان" });
      return;
    }
    if (!formPhone.trim()) {
      Toast.show({ type: "error", text1: "يرجى كتابة رقم الجوال" });
      return;
    }

    const payload = {
      title: formTitle,
      recipientName: formRecipient.trim(),
      phonenumber: formPhone.trim(),
      destination: {
        country: locationInfo.country || "السعودية",
        city: formCity.trim() || locationInfo.city || "الرياض",
        district: formDistrict.trim() || locationInfo.district || "",
        postalcode: formPostalCode.trim() || locationInfo.postalcode || "",
        street1: formStreet.trim(),
        state: locationInfo.state || "منطقة الرياض",
      },
      coordinates: centerCoords,
      isDefault: formIsDefault,
    };

    try {
      if (editingAddressId) {
        await updateAddressMutation.mutateAsync({
          addressId: editingAddressId,
          ...payload,
        });
        Toast.show({ type: "success", text1: "تم تحديث العنوان بنجاح" });
      } else {
        const res = await createAddressMutation.mutateAsync(payload);
        Toast.show({ type: "success", text1: "تمت إضافة العنوان بنجاح" });

        // If cart is present, link newly created address
        if (res?.address?._id) {
          try {
            await updateCartAddressMutation.mutateAsync(res.address._id);
          } catch (_) {}
        }
      }

      setIsDetailsModalVisible(false);
      setIsMapModalVisible(false);
      setEditingAddressId(null);
      refetch();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.error || "فشل حفظ العنوان، يرجى المحاولة لاحقاً",
      });
    }
  };

  // Set Default Address
  const handleSetDefault = async (address) => {
    try {
      await setDefaultMutation.mutateAsync(address._id);
      try {
        await updateCartAddressMutation.mutateAsync(address._id);
      } catch (_) {}
      Toast.show({ type: "success", text1: "تم تعيين العنوان كافتراضي" });
      setIsActionModalVisible(false);
      refetch();
    } catch (err) {
      Toast.show({ type: "error", text1: "فشل تعيين العنوان الافتراضي" });
    }
  };

  // Delete Address
  const handleDeleteAddress = async (address) => {
    Alert.alert("تأكيد الحذف", `هل أنت متأكد من حذف العنوان "${address.title}"؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAddressMutation.mutateAsync(address._id);
            Toast.show({ type: "success", text1: "تم حذف العنوان بنجاح" });
            setIsActionModalVisible(false);
            refetch();
          } catch (err) {
            Toast.show({ type: "error", text1: "فشل حذف العنوان" });
          }
        },
      },
    ]);
  };

  // Open Edit flow
  const handleEditAddress = (address) => {
    setIsActionModalVisible(false);
    setEditingAddressId(address._id);
    setFormTitle(address.title || "المنزل");
    setFormRecipient(address.recipientName || "");
    setFormPhone(address.phonenumber || "");
    setFormStreet(address.destination?.street1 || "");
    setFormDistrict(address.destination?.district || "");
    setFormCity(address.destination?.city || "الرياض");
    setFormPostalCode(address.destination?.postalcode || "");
    setFormIsDefault(address.isDefault || false);

    if (address.coordinates?.latitude && address.coordinates?.longitude) {
      setCenterCoords(address.coordinates);
    }

    setIsDetailsModalVisible(true);
  };

  // Select Address for Cart
  const handleSelectAddress = async (address) => {
    try {
      await updateCartAddressMutation.mutateAsync(address._id);
      Toast.show({
        type: "success",
        text1: "تم اختيار موقع التوصيل بنجاح",
        text2: address.title,
      });
      // Optionally navigate back if came from cart
      router.back();
    } catch (_) {
      handleSetDefault(address);
    }
  };

  // Share Address
  const handleShareAddress = async (address) => {
    try {
      const dest = address.destination || {};
      const shareMessage = `عنوان التوصيل - دكانة:\n${address.title}: ${dest.street1} - ${dest.district} - ${dest.city}\nرقم التواصل: ${address.phonenumber}`;
      await Share.share({ message: shareMessage });
    } catch (_) {}
  };

  // Format Address display string
  const formatAddressString = (address) => {
    const dest = address.destination || {};
    return [
      dest.street1,
      dest.district,
      dest.city,
      dest.state,
      dest.postalcode,
    ]
      .filter(Boolean)
      .join(" - ");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]} dir="rtl">
      {/* ─── Top Header ─── */}
      <View className="flex-row-reverse items-center justify-between px-5 py-3 border-b border-gray-100">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="p-1.5 -mr-1 rounded-xl"
        >
          <ArrowRight size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: Fonts.Cairo_Bold,
            fontSize: 17,
            color: Colors.text,
          }}
        >
          قائمة العناوين
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* ─── Subtitle & Warning Notice (Screenshot 2) ─── */}
        <View className="mb-4">
          <Text
            style={{
              fontFamily: Fonts.Cairo_Bold,
              fontSize: 18,
              color: Colors.text,
              textAlign: "right",
            }}
          >
            اختر موقع التوصيل
          </Text>
          <Text
            style={{
              fontFamily: Fonts.Cairo_Regular,
              fontSize: 12,
              color: "#D97706",
              textAlign: "right",
              marginTop: 4,
            }}
          >
            تغيير العنوان قد يؤثر على محتويات السلة. يرجى المراجعة.
          </Text>
        </View>

        {/* ─── Search Input Bar (Screenshot 2) ─── */}
        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 16,
          }}
        >
          <Search size={18} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="دور على المبنى، المنطقة..."
            placeholderTextColor="#9CA3AF"
            style={{
              flex: 1,
              fontFamily: Fonts.Cairo_Regular,
              fontSize: 13,
              color: Colors.text,
              textAlign: "right",
              marginRight: 10,
              padding: 0,
            }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ─── "+ أضف عنوان جديد" Action Button (Screenshot 2) ─── */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleOpenMapModal}
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 18,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
            <Plus size={20} color={Colors.primary} />
            <Text
              style={{
                fontFamily: Fonts.Cairo_Bold,
                fontSize: 14,
                color: Colors.primary,
              }}
            >
              أضف عنوان جديد
            </Text>
          </View>
          <ChevronLeft size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* ─── Saved Addresses List (Screenshot 2) ─── */}
        {isLoading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text
              style={{
                fontFamily: Fonts.Cairo_Regular,
                fontSize: 12,
                color: Colors.textSecondary,
                marginTop: 10,
              }}
            >
              جارٍ تحميل العناوين...
            </Text>
          </View>
        ) : filteredAddresses.length === 0 ? (
          <View className="py-14 items-center justify-center">
            <View className="h-16 w-16 rounded-full bg-surface items-center justify-center mb-3">
              <MapPin size={28} color={Colors.primary} />
            </View>
            <Text
              style={{
                fontFamily: Fonts.Cairo_Bold,
                fontSize: 15,
                color: Colors.text,
                textAlign: "center",
              }}
            >
              {searchQuery ? "لا توجد نتائج مطابقة" : "لا توجد عناوين توصيل بعد"}
            </Text>
            <Text
              style={{
                fontFamily: Fonts.Cairo_Regular,
                fontSize: 12,
                color: Colors.textSecondary,
                textAlign: "center",
                marginTop: 4,
              }}
            >
              اضغط على "أضف عنوان جديد" لتحديد موقعك على الخريطة
            </Text>
          </View>
        ) : (
          filteredAddresses.map((address) => {
            const isHome = address.title === "المنزل";
            const isWork = address.title === "العمل";

            return (
              <View
                key={address._id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor: address.isDefault ? Colors.primary : "#E5E7EB",
                  overflow: "hidden",
                  marginBottom: 14,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1.5 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {/* ── Card Header Bar ── */}
                <View
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#F9FAFB",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                  }}
                >
                  {/* Right side: Icon + Title + Badge */}
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: "#111827",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isWork ? (
                        <Briefcase size={16} color="#FFFFFF" />
                      ) : (
                        <Home size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: Fonts.Cairo_Bold,
                        fontSize: 14,
                        color: "#111827",
                      }}
                    >
                      {address.title || "المنزل"}
                    </Text>
                    <View
                      style={{
                        backgroundColor: address.isDefault ? "#FEE2E2" : "#F3F4F6",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: Fonts.Cairo_Bold,
                          fontSize: 10,
                          color: address.isDefault ? Colors.primary : "#6B7280",
                        }}
                      >
                        {address.isDefault ? "افتراضي" : "3 m"}
                      </Text>
                    </View>
                  </View>

                  {/* Left side: Share + 3-dots */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedAddressForAction(address);
                        setIsActionModalVisible(true);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MoreVertical size={18} color="#6B7280" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleShareAddress(address)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Share2 size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── Card Body (Selectable) ── */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectAddress(address)}
                  style={{ padding: 14 }}
                >
                  <Text
                    style={{
                      fontFamily: Fonts.Cairo_Regular,
                      fontSize: 13,
                      color: "#374151",
                      textAlign: "right",
                      lineHeight: 22,
                    }}
                  >
                    {formatAddressString(address)}
                  </Text>

                  {/* Phone number and Recipient line */}
                  <View
                    style={{
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 10,
                    }}
                  >
                    <CheckCircle2 size={16} color="#10B981" />
                    <Text
                      style={{
                        fontFamily: Fonts.Cairo_Bold,
                        fontSize: 12,
                        color: "#4B5563",
                      }}
                      dir="ltr"
                    >
                      {address.phonenumber}
                      {address.recipientName ? `, ${address.recipientName}` : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────
          1. FULL-SCREEN MAP MODAL WITH SMOOTH TRANSITION (Screenshot 1)
         ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isMapModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsMapModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
          {/* Map View */}
          <View style={{ flex: 1, position: "relative" }}>
            {MapComponent ? (
              <MapComponent
                style={{ width: "100%", height: "100%" }}
                cameraPosition={{
                  coordinates: centerCoords,
                  zoom: 16,
                }}
                onCameraMove={handleCameraMove}
                properties={{
                  isMyLocationEnabled: true,
                }}
                uiSettings={{
                  myLocationButtonEnabled: false,
                  compassEnabled: false,
                }}
              />
            ) : (
              <View className="flex-1 bg-slate-100 items-center justify-center p-6">
                <MapPin size={40} color={Colors.primary} />
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 14,
                    color: Colors.text,
                    marginTop: 12,
                  }}
                >
                  {locationInfo.displayTitle}
                </Text>
              </View>
            )}

            {/* ── Top Floating Search Bar (Screenshot 1) ── */}
            <View
              style={{
                position: "absolute",
                top: 14,
                left: 16,
                right: 16,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                flexDirection: "row-reverse",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.12,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setIsMapModalVisible(false)}
                className="p-1 -mr-1"
              >
                <ArrowRight size={20} color="#374151" />
              </TouchableOpacity>
              <TextInput
                value={mapSearchText}
                onChangeText={setMapSearchText}
                placeholder="دور على المبنى، المنطقة..."
                placeholderTextColor="#9CA3AF"
                style={{
                  flex: 1,
                  fontFamily: Fonts.Cairo_Regular,
                  fontSize: 13,
                  color: "#1F2937",
                  textAlign: "right",
                  marginRight: 10,
                  padding: 0,
                }}
              />
              <Search size={18} color="#9CA3AF" />
            </View>

            {/* ── Fixed Center Pin & Tooltip Bubble (Screenshot 1) ── */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 140,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Tooltip bubble */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 6,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: "#F3F4F6",
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 13,
                    color: "#1F2937",
                    textAlign: "center",
                  }}
                >
                  سيتم توصيل طلبك إلى هذا الموقع
                </Text>
                {/* Pointer triangle */}
                <View
                  style={{
                    position: "absolute",
                    bottom: -6,
                    alignSelf: "center",
                    width: 0,
                    height: 0,
                    borderLeftWidth: 6,
                    borderRightWidth: 6,
                    borderTopWidth: 6,
                    borderLeftColor: "transparent",
                    borderRightColor: "transparent",
                    borderTopColor: "#FFFFFF",
                  }}
                />
              </View>

              {/* Black Pin icon */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#111827",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 5,
                  elevation: 5,
                }}
              >
                <MapPin size={22} color="#FFFFFF" />
              </View>

              {/* Blue pulse dot underneath */}
              <View
                style={{
                  width: 16,
                  height: 6,
                  borderRadius: 8,
                  backgroundColor: "rgba(37, 99, 235, 0.45)",
                  marginTop: 2,
                }}
              />
            </View>

            {/* ── Floating "الموقع الحالي" Button (Screenshot 1) ── */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleGetCurrentLocation}
              disabled={isLocating}
              style={{
                position: "absolute",
                bottom: 175,
                alignSelf: "center",
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <Navigation size={16} color="#111827" />
              )}
              <Text
                style={{
                  fontFamily: Fonts.Cairo_Bold,
                  fontSize: 13,
                  color: "#111827",
                }}
              >
                الموقع الحالي
              </Text>
            </TouchableOpacity>

            {/* ── Bottom Sheet Card (Screenshot 1) ── */}
            <View
              style={{
                position: "absolute",
                bottom: 20,
                left: 16,
                right: 16,
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 18,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#111827",
                    alignItems: "center",
                    justifyContent: "center",
                    shrink: 0,
                  }}
                >
                  <MapPin size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text
                    style={{
                      fontFamily: Fonts.Cairo_Bold,
                      fontSize: 16,
                      color: "#111827",
                      textAlign: "right",
                    }}
                    numberOfLines={1}
                  >
                    {isGeocoding ? "جارٍ تحديد العنوان..." : locationInfo.displayTitle}
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.Cairo_Regular,
                      fontSize: 12,
                      color: "#6B7280",
                      textAlign: "right",
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {locationInfo.displaySubtitle}
                  </Text>
                </View>
              </View>

              {/* Add Address Details Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleProceedToDetails}
                style={{
                  marginTop: 16,
                  backgroundColor: "#1F242F",
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 15,
                    color: "#FFFFFF",
                  }}
                >
                  أضف تفاصيل العنوان
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          2. ADDRESS DETAILS MODAL (FORM)
         ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isDetailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 22,
              maxHeight: SCREEN_HEIGHT * 0.88,
            }}
          >
            {/* Header */}
            <View className="flex-row-reverse items-center justify-between pb-3 border-b border-gray-100">
              <Text
                style={{
                  fontFamily: Fonts.Cairo_Bold,
                  fontSize: 17,
                  color: Colors.text,
                }}
              >
                {editingAddressId ? "تعديل تفاصيل العنوان" : "تفاصيل عنوان التوصيل"}
              </Text>
              <TouchableOpacity
                onPress={() => setIsDetailsModalVisible(false)}
                className="p-1 rounded-full bg-gray-100"
              >
                <X size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="pt-4 space-y-4">
              {/* Title Chips (المنزل / العمل / أخرى) */}
              <View>
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 13,
                    color: Colors.text,
                    textAlign: "right",
                    marginBottom: 8,
                  }}
                >
                  نوع العنوان
                </Text>
                <View className="flex-row-reverse gap-2.5">
                  {[
                    { label: "المنزل", icon: Home },
                    { label: "العمل", icon: Briefcase },
                    { label: "استراحة", icon: MapPin },
                  ].map((chip) => {
                    const isSelected = formTitle === chip.label;
                    const IconComp = chip.icon;
                    return (
                      <TouchableOpacity
                        key={chip.label}
                        activeOpacity={0.7}
                        onPress={() => setFormTitle(chip.label)}
                        style={{
                          flexDirection: "row-reverse",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 12,
                          backgroundColor: isSelected ? Colors.primary : "#F3F4F6",
                        }}
                      >
                        <IconComp size={15} color={isSelected ? "#FFFFFF" : "#4B5563"} />
                        <Text
                          style={{
                            fontFamily: Fonts.Cairo_Bold,
                            fontSize: 12,
                            color: isSelected ? "#FFFFFF" : "#4B5563",
                          }}
                        >
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Recipient Name */}
              <View>
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 12,
                    color: Colors.text,
                    textAlign: "right",
                    marginBottom: 6,
                  }}
                >
                  اسم المستلم
                </Text>
                <View className="flex-row-reverse items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                  <User size={16} color="#9CA3AF" />
                  <TextInput
                    value={formRecipient}
                    onChangeText={setFormRecipient}
                    placeholder="مثال: علي إدريس"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      flex: 1,
                      fontFamily: Fonts.Cairo_Regular,
                      fontSize: 13,
                      color: Colors.text,
                      textAlign: "right",
                      marginRight: 8,
                      padding: 0,
                    }}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View>
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 12,
                    color: Colors.text,
                    textAlign: "right",
                    marginBottom: 6,
                  }}
                >
                  رقم الجوال للتوصيل
                </Text>
                <View className="flex-row-reverse items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                  <Phone size={16} color="#9CA3AF" />
                  <TextInput
                    value={formPhone}
                    onChangeText={setFormPhone}
                    placeholder="05XXXXXXXX أو +966..."
                    keyboardType="phone-pad"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      flex: 1,
                      fontFamily: Fonts.Cairo_Regular,
                      fontSize: 13,
                      color: Colors.text,
                      textAlign: "right",
                      marginRight: 8,
                      padding: 0,
                    }}
                  />
                </View>
              </View>

              {/* Street & Building Name */}
              <View>
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 12,
                    color: Colors.text,
                    textAlign: "right",
                    marginBottom: 6,
                  }}
                >
                  اسم الشارع ورقم المبنى
                </Text>
                <TextInput
                  value={formStreet}
                  onChangeText={setFormStreet}
                  placeholder="مثال: شارع ابي بكر الرازي - مبنى 24"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    fontFamily: Fonts.Cairo_Regular,
                    fontSize: 13,
                    color: Colors.text,
                    backgroundColor: "#F9FAFB",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    textAlign: "right",
                  }}
                />
              </View>

              {/* District & City */}
              <View className="flex-row-reverse gap-3">
                <View className="flex-1">
                  <Text
                    style={{
                      fontFamily: Fonts.Cairo_Bold,
                      fontSize: 12,
                      color: Colors.text,
                      textAlign: "right",
                      marginBottom: 6,
                    }}
                  >
                    الحي
                  </Text>
                  <TextInput
                    value={formDistrict}
                    onChangeText={setFormDistrict}
                    placeholder="مثال: السليمانية"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      fontFamily: Fonts.Cairo_Regular,
                      fontSize: 13,
                      color: Colors.text,
                      backgroundColor: "#F9FAFB",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      textAlign: "right",
                    }}
                  />
                </View>

                <View className="flex-1">
                  <Text
                    style={{
                      fontFamily: Fonts.Cairo_Bold,
                      fontSize: 12,
                      color: Colors.text,
                      textAlign: "right",
                      marginBottom: 6,
                    }}
                  >
                    المدينة
                  </Text>
                  <TextInput
                    value={formCity}
                    onChangeText={setFormCity}
                    placeholder="الرياض"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      fontFamily: Fonts.Cairo_Regular,
                      fontSize: 13,
                      color: Colors.text,
                      backgroundColor: "#F9FAFB",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      textAlign: "right",
                    }}
                  />
                </View>
              </View>

              {/* Default Address Checkbox */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setFormIsDefault(!formIsDefault)}
                className="flex-row-reverse items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200"
              >
                <View className="items-end">
                  <Text
                    style={{
                      fontFamily: Fonts.Cairo_Bold,
                      fontSize: 13,
                      color: Colors.text,
                    }}
                  >
                    تعيين كعنوان افتراضي
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.Cairo_Regular,
                      fontSize: 11,
                      color: Colors.textSecondary,
                    }}
                  >
                    سيتم اعتماد هذا العنوان تلقائياً لطلباتك القادمة
                  </Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    borderColor: formIsDefault ? Colors.primary : "#D1D5DB",
                    backgroundColor: formIsDefault ? Colors.primary : "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {formIsDefault && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </TouchableOpacity>

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSaveAddress}
                disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                style={{
                  backgroundColor: Colors.primary,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 8,
                  marginBottom: 16,
                }}
              >
                {createAddressMutation.isPending || updateAddressMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      fontFamily: Fonts.Cairo_Bold,
                      fontSize: 15,
                      color: "#FFFFFF",
                    }}
                  >
                    {editingAddressId ? "حفظ التعديلات" : "تأكيد وحفظ العنوان"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          3. ADDRESS OPTIONS BOTTOM SHEET (ACTIONS)
         ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={isActionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsActionModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsActionModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
            }}
          >
            <View className="items-center pb-2">
              <View className="w-12 h-1.5 bg-gray-200 rounded-full mb-3" />
              <Text
                style={{
                  fontFamily: Fonts.Cairo_Bold,
                  fontSize: 15,
                  color: Colors.text,
                }}
              >
                خيارات العنوان: {selectedAddressForAction?.title}
              </Text>
            </View>

            <View className="space-y-2 pt-2">
              {/* Set as Default */}
              {!selectedAddressForAction?.isDefault && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSetDefault(selectedAddressForAction)}
                  className="flex-row-reverse items-center gap-3 p-3.5 rounded-xl bg-gray-50"
                >
                  <Star size={18} color="#D97706" />
                  <Text
                    style={{
                      fontFamily: Fonts.Cairo_Bold,
                      fontSize: 13,
                      color: Colors.text,
                    }}
                  >
                    تعيين كعنوان افتراضي
                  </Text>
                </TouchableOpacity>
              )}

              {/* Edit */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleEditAddress(selectedAddressForAction)}
                className="flex-row-reverse items-center gap-3 p-3.5 rounded-xl bg-gray-50"
              >
                <Edit3 size={18} color="#3B82F6" />
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 13,
                    color: Colors.text,
                  }}
                >
                  تعديل تفاصيل العنوان
                </Text>
              </TouchableOpacity>

              {/* Delete */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleDeleteAddress(selectedAddressForAction)}
                className="flex-row-reverse items-center gap-3 p-3.5 rounded-xl bg-red-50"
              >
                <Trash2 size={18} color="#EF4444" />
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 13,
                    color: "#EF4444",
                  }}
                >
                  حذف العنوان
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
