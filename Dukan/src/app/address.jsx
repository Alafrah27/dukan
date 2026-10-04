import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import {
  ArrowRight,
  ChevronLeft,
  Plus,
  MapPin,
  Home,
  Briefcase,
  MoreVertical,
  Share2,
  CheckCircle2,
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
import AddressMapModal from "../components/customer/address/AddressMapModal";
import AddressDetailsModal from "../components/customer/address/AddressDetailsModal";
import AddressActionsModal from "../components/customer/address/AddressActionsModal";

// Default Riyadh Center Coordinates
const DEFAULT_COORDS = {
  latitude: 24.7136,
  longitude: 46.6753,
};

const EMPTY_LOCATION = {
  street1: "",
  district: "",
  city: "",
  country: "",
  postalcode: "",
  state: "",
  displayTitle: "حرّك الخريطة لتحديد موقعك",
  displaySubtitle: "",
};

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

  // Modals State
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [selectedAddressForAction, setSelectedAddressForAction] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Map & Location State
  const [centerCoords, setCenterCoords] = useState(DEFAULT_COORDS);
  const [cameraTarget, setCameraTarget] = useState({ coordinates: DEFAULT_COORDS, zoom: 16 });
  const latestCameraRef = useRef({ coordinates: DEFAULT_COORDS, zoom: 16 });
  const committedCoordsRef = useRef(DEFAULT_COORDS);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationInfo, setLocationInfo] = useState(EMPTY_LOCATION);

  // Form State
  const [form, setForm] = useState({
    title: "المنزل",
    recipient: "",
    phone: "",
    street: "",
    district: "",
    city: "",
    postalCode: "",
    country: "",
    isDefault: false,
  });

  const geocodeTimeoutRef = useRef(null);

  // Populate recipient info from user profile
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        recipient: prev.recipient || user.fullName || user.firstName || "",
        phone: prev.phone || user.primaryPhoneNumber?.phoneNumber || "",
      }));
    }
  }, [user]);

  const handleFormChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "country") {
      setLocationInfo((prev) => ({ ...prev, country: value }));
    }
  };

  // Reverse Geocoding via expo-location
  const reverseGeocode = async (latitude, longitude) => {
    try {
      setIsGeocoding(true);
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const place = results[0];
        const street = place.street || place.name || "";
        const district = place.district || place.subregion || "";
        const city = place.city || place.region || "";
        const country = place.country || "";
        const postalcode = place.postalCode || "";
        const state = place.region || "";

        setLocationInfo({
          street1: street,
          district: district,
          city: city,
          country: country,
          postalcode: postalcode,
          state: state,
          displayTitle: street || city || "موقع غير معروف",
          displaySubtitle: [district, city, country].filter(Boolean).join(" - "),
        });

        // Prefill form with geocoded info
        setForm((prev) => ({
          ...prev,
          street: street || prev.street,
          district: district || prev.district,
          city: city || prev.city,
          postalCode: postalcode || prev.postalCode,
          country: country || prev.country,
        }));
      }
    } catch (err) {
      console.warn("Reverse geocoding error:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Programmatically move the map camera
  const moveCameraTo = (coords) => {
    const zoom = latestCameraRef.current.zoom || 16;
    latestCameraRef.current = { coordinates: coords, zoom };
    committedCoordsRef.current = coords;
    setCenterCoords(coords);
    setCameraTarget({ coordinates: { ...coords }, zoom });
  };

  // Debounced Camera Move — no per-frame re-renders to prevent map shaking
  const handleCameraMove = (event) => {
    const coords = event?.coordinates;
    if (typeof coords?.latitude !== "number" || typeof coords?.longitude !== "number") return;

    latestCameraRef.current = {
      coordinates: { latitude: coords.latitude, longitude: coords.longitude },
      zoom: typeof event?.zoom === "number" ? event.zoom : latestCameraRef.current.zoom,
    };

    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    geocodeTimeoutRef.current = setTimeout(() => {
      const { latitude, longitude } = latestCameraRef.current.coordinates;
      const prev = committedCoordsRef.current;
      const moved =
        Math.abs(prev.latitude - latitude) > 0.00001 ||
        Math.abs(prev.longitude - longitude) > 0.00001;
      if (!moved) return;
      committedCoordsRef.current = { latitude, longitude };
      setCenterCoords({ latitude, longitude });
      reverseGeocode(latitude, longitude);
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    };
  }, []);

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
        moveCameraTo(newCoords);
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

  // Open Map Modal for New Address
  const handleOpenMapModal = () => {
    setEditingAddressId(null);
    setForm({
      title: "المنزل",
      recipient: user?.fullName || user?.firstName || "",
      phone: user?.primaryPhoneNumber?.phoneNumber || "",
      street: "",
      district: "",
      city: "",
      postalCode: "",
      country: "",
      isDefault: addresses.length === 0,
    });
    setLocationInfo(EMPTY_LOCATION);
    setIsMapModalVisible(true);
    handleGetCurrentLocation();
  };

  // Open Details Modal from Map Bottom Card
  const handleProceedToDetails = () => {
    setIsDetailsModalVisible(true);
  };

  // Save Address Submission
  const handleSaveAddress = async () => {
    if (!form.street.trim()) {
      Toast.show({ type: "error", text1: "يرجى كتابة اسم الشارع أو تفاصيل العنوان" });
      return;
    }
    if (!form.phone.trim()) {
      Toast.show({ type: "error", text1: "يرجى كتابة رقم الجوال" });
      return;
    }
    if (!form.city.trim()) {
      Toast.show({ type: "error", text1: "يرجى كتابة اسم المدينة" });
      return;
    }
    if (!form.postalCode.trim()) {
      Toast.show({ type: "error", text1: "يرجى كتابة الرمز البريدي" });
      return;
    }
    const country = (form.country || locationInfo.country || "").trim();
    if (!country) {
      Toast.show({ type: "error", text1: "يرجى كتابة اسم الدولة" });
      return;
    }

    const payload = {
      title: form.title,
      recipientName: form.recipient.trim(),
      phonenumber: form.phone.trim(),
      destination: {
        country,
        city: form.city.trim(),
        district: form.district.trim(),
        postalcode: form.postalCode.trim(),
        street1: form.street.trim(),
        state: locationInfo.state || "",
      },
      coordinates: centerCoords,
      isDefault: form.isDefault,
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
    const d = address.destination || {};
    setForm({
      title: address.title || "المنزل",
      recipient: address.recipientName || "",
      phone: address.phonenumber || "",
      street: d.street1 || "",
      district: d.district || "",
      city: d.city || "",
      postalCode: d.postalcode || "",
      country: d.country || "",
      isDefault: address.isDefault || false,
    });

    setLocationInfo({
      street1: d.street1 || "",
      district: d.district || "",
      city: d.city || "",
      country: d.country || "",
      postalcode: d.postalcode || "",
      state: d.state || "",
      displayTitle: d.street1 || d.city || "",
      displaySubtitle: [d.district, d.city, d.country].filter(Boolean).join(" - "),
    });

    if (address.coordinates?.latitude && address.coordinates?.longitude) {
      moveCameraTo({
        latitude: address.coordinates.latitude,
        longitude: address.coordinates.longitude,
      });
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
        {/* ─── Subtitle & Warning Notice ─── */}
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

        {/* ─── "+ أضف عنوان جديد" Action Button ─── */}
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

        {/* ─── Saved Addresses List ─── */}
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
        ) : addresses.length === 0 ? (
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
              لا توجد عناوين توصيل بعد
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
          addresses.map((address) => {
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

      {/* ─── Modals (Modular Components) ─── */}
      <AddressMapModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        cameraTarget={cameraTarget}
        onCameraMove={handleCameraMove}
        locationInfo={locationInfo}
        isGeocoding={isGeocoding}
        isLocating={isLocating}
        onGetCurrentLocation={handleGetCurrentLocation}
        onProceed={handleProceedToDetails}
      />

      <AddressDetailsModal
        visible={isDetailsModalVisible}
        onClose={() => setIsDetailsModalVisible(false)}
        isEditing={Boolean(editingAddressId)}
        form={form}
        onChange={handleFormChange}
        onSubmit={handleSaveAddress}
        isSaving={createAddressMutation.isPending || updateAddressMutation.isPending}
      />

      <AddressActionsModal
        visible={isActionModalVisible}
        onClose={() => setIsActionModalVisible(false)}
        address={selectedAddressForAction}
        onSetDefault={handleSetDefault}
        onEdit={handleEditAddress}
        onDelete={handleDeleteAddress}
      />
    </SafeAreaView>
  );
}
