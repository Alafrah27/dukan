import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser, useClerk } from "@clerk/expo";
import Svg, { Path, Circle } from "react-native-svg";
import {
  User,
  Bell,
  LogOut,
  ChevronLeft,
  ShieldCheck,
  Package,
  MapPin,
  Navigation,
  Info,
  FileText,
  Shield,
  Trash2,
  Headphones,
} from "lucide-react-native";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import { Colors } from "../../constants/Colors";
import { Fonts } from "../../constants/Fonts";
import { useAppContext } from "../../context/authContext";
import { useDeleteAccount } from "../../store/userQuery";

// Smooth Custom Animated Switch Component
function AnimatedSwitch({
  value,
  onValueChange,
  activeColor = Colors.primary,
  inactiveColor = "#E5E7EB",
}) {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const left = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 23],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onValueChange(!value)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          backgroundColor,
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            left,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1.5 },
            shadowOpacity: 0.18,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// Real Official WhatsApp Vector Icon
function WhatsAppIcon({ size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"
        fill="#25D366"
      />
      <Path
        d="M17.52 14.33C17.22 14.18 15.75 13.46 15.48 13.36C15.21 13.26 15.01 13.21 14.81 13.51C14.61 13.81 14.04 14.48 13.86 14.68C13.69 14.88 13.51 14.91 13.21 14.76C12.91 14.61 11.95 14.3 10.82 13.29C9.94 12.51 9.34 11.54 9.17 11.24C9 10.94 9.15 10.78 9.3 10.63C9.43 10.5 9.6 10.28 9.75 10.1C9.9 9.93 9.95 9.8 10.05 9.6C10.15 9.4 10.1 9.23 10.02 9.08C9.95 8.93 9.35 7.45 9.1 6.85C8.86 6.27 8.61 6.35 8.43 6.34C8.26 6.33 8.06 6.33 7.86 6.33C7.66 6.33 7.34 6.41 7.07 6.7C6.8 7 6.03 7.72 6.03 9.19C6.03 10.66 7.1 12.08 7.25 12.28C7.4 12.48 9.35 15.49 12.34 16.78C13.05 17.09 13.61 17.28 14.05 17.42C14.77 17.65 15.42 17.62 15.93 17.54C16.51 17.45 17.71 16.81 17.96 16.11C18.21 15.41 18.21 14.81 18.13 14.68C18.06 14.56 17.82 14.48 17.52 14.33Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Real Official Telegram Vector Icon
function TelegramIcon({ size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10.5" fill="#0088CC" />
      <Path
        d="M7.4 11.9L16.2 8.4C16.6 8.2 17 8.5 16.8 8.9L15.3 16.1C15.2 16.6 14.9 16.7 14.5 16.4L12.2 14.7L11.1 15.8C11 15.9 10.9 16 10.7 16L10.9 13.7L15.1 9.9C15.3 9.7 15.1 9.6 14.8 9.8L9.6 13.1L7.3 12.4C6.8 12.2 6.8 11.9 7.4 11.9Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Real Phone Call Vector Icon
function PhoneIcon({ size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10.5" fill={Colors.primary} />
      <Path
        d="M16.5 14.5C15.5 14.5 14.5 14.3 13.7 14C13.4 13.9 13.1 14 12.9 14.2L11.5 16.1C9.6 15.1 8 13.5 7 11.6L8.8 10.1C9.1 9.9 9.2 9.6 9.1 9.3C8.8 8.5 8.6 7.5 8.6 6.5C8.6 6 8.1 5.5 7.6 5.5H5.5C5 5.5 4.5 6 4.5 6.5C4.5 13.1 9.9 18.5 16.5 18.5C17 18.5 17.5 18 17.5 17.5V15.5C17.5 15 17 14.5 16.5 14.5Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

export default function CustomerSettings() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useClerk();
  const {
    notificationsEnabled,
    toggleNotifications,
  } = useAppContext();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const deleteAccountMutation = useDeleteAccount();

  // Check initial foreground location permission on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (isMounted) {
          setLocationEnabled(status === "granted");
        }
      } catch {
        // Fallback silently if not available
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Location switch toggle handler with native permission request
  const handleToggleLocation = async (nextVal) => {
    if (nextVal) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setLocationEnabled(true);
        } else {
          setLocationEnabled(false);
          Alert.alert(
            "خدمات الموقع",
            "يرجى تفعيل صلاحية الموقع من إعدادات الهاتف لتحديد موقع التوصيل بدقة وسرعة."
          );
        }
      } catch {
        setLocationEnabled(nextVal);
      }
    } else {
      setLocationEnabled(false);
    }
  };

  // Notifications switch toggle handler (delegates to context)
  const handleToggleNotifications = (nextVal) => {
    toggleNotifications(nextVal);
  };

  // Calculate profile completion percentage (0 - 100%)
  const percentage = useMemo(() => {
    if (!user) return 0;

    const hasFullName = Boolean(
      user.fullName || (user.firstName && user.lastName)
    );
    const hasEmail = Boolean(user.primaryEmailAddress?.emailAddress);
    const hasImage = Boolean(
      user.imageUrl && !user.imageUrl.includes("default")
    );
    const hasPhone = Boolean(user.primaryPhoneNumber?.phoneNumber);

    const items = [hasFullName, hasEmail, hasImage, hasPhone];
    const completedCount = items.filter(Boolean).length;
    return completedCount * 25;
  }, [user]);

  // Sign out confirmation handler
  const handleSignOut = () => {
    Alert.alert(
      "تسجيل الخروج",
      "هل أنت متأكد من رغبتك في تسجيل الخروج من متجر دكان؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تسجيل الخروج",
          style: "destructive",
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
              router.replace("/");
            } catch (err) {
              console.error("Sign out error:", err);
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  // Delete account confirmation and execution handler
  const handleDeleteAccount = () => {
    Alert.alert(
      "حذف الحساب نهائياً",
      "هل أنت متأكد تماماً من رغبتك في حذف حسابك من متجر دكان؟ سيتم مسح بياناتك الشخصية ومقاساتك المحفوظة نهائياً ولا يمكن استرجاعها.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "نعم، حذف الحساب",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeletingAccount(true);

              // 1. Delete user from backend database
              try {
                await deleteAccountMutation.mutateAsync();
              } catch (backendErr) {
                console.warn("Backend user deletion error:", backendErr);
              }

              // 2. Delete user from Clerk
              if (user && typeof user.delete === "function") {
                await user.delete();
              }

              // 3. Clear auth session
              try {
                await signOut();
              } catch (_) { }

              Toast.show({
                type: "info",
                text1: "تم حذف الحساب",
                text2: "تم حذف حسابك بنجاح من متجر دكان.",
              });

              router.replace("/");
            } catch (err) {
              console.error("Delete account error:", err);
              Alert.alert(
                "خطأ في حذف الحساب",
                "تعذر استكمال حذف الحساب حالياً. يرجى المحاولة مرة أخرى."
              );
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const SUPPORT_PHONE = "00966555475592";

  // Open direct phone call
  const handleOpenPhone = async () => {
    const url = `tel:${SUPPORT_PHONE}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("تنبيه", `رقم الدعم الفني: ${SUPPORT_PHONE}`);
    }
  };

  // Open WhatsApp
  const handleOpenWhatsApp = async () => {
    const url = "https://wa.me/966555475592";
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("خطأ", "تعذر فتح تطبيق واتساب.");
    }
  };

  // Open Telegram
  const handleOpenTelegram = async () => {
    const url = "https://t.me/+966555475592";
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("خطأ", "تعذر فتح تطبيق تيليجرام.");
    }
  };

  if (!isUserLoaded) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: Colors.background }}
      >
        <ActivityIndicator size="small" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const userEmail = user?.primaryEmailAddress?.emailAddress || "—";
  const userFullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "عميل دكان";
  const memberSince = user?.createdAt
    ? new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
    }).format(new Date(user.createdAt))
    : "عضو جديد";

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: Colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View className="mb-5 items-end">
          <Text
            style={{
              color: Colors.text,
              fontSize: 24,
              fontFamily: Fonts.Cairo_Bold,
              textAlign: "right",
            }}
          >
            الملف الشخصي والإعدادات
          </Text>

        </View>

        {/* User Information Card with embedded Progress Bar directly under "عضو منذ..." */}
        <View
          className="rounded-3xl p-5 mb-5"
          style={{
            backgroundColor: Colors.white,
            borderWidth: 1,
            borderColor: "rgba(168, 79, 53, 0.08)",
          }}
        >
          <View className="flex-row-reverse items-center gap-4">
            {/* User Avatar */}
            <View
              className="h-20 w-20 rounded-2xl items-center justify-center overflow-hidden"
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 2,
                borderColor: Colors.white,
              }}
            >
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <User size={34} color={Colors.primary} />
              )}
            </View>

            {/* User Names & Membership */}
            <View className="flex-1 items-end">
              <View className="flex-row-reverse items-center gap-1.5 mb-1">
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 18,
                    fontFamily: Fonts.Cairo_Bold,
                    textAlign: "right",
                  }}
                  numberOfLines={1}
                >
                  {userFullName}
                </Text>
                <ShieldCheck size={16} color={Colors.primary} />
              </View>

              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 12,
                  fontFamily: Fonts.Cairo_Regular,
                  textAlign: "right",
                }}
                numberOfLines={1}
              >
                {userEmail}
              </Text>

              {/* Member badge */}
              <View
                className="mt-2.5 rounded-full px-3 py-0.5"
                style={{ backgroundColor: Colors.surfaceSelected }}
              >
                <Text
                  style={{
                    color: Colors.primary,
                    fontSize: 11,
                    fontFamily: Fonts.Cairo_Bold,
                  }}
                >
                  عضو منذ {memberSince}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar placed directly under Member Badge */}
          <View className="mt-4 pt-3 border-t border-gray-100">
            <View className="flex-row-reverse items-center justify-between mb-1.5">
              <Text
                style={{
                  color: Colors.textSecondary,
                  fontSize: 11,
                  fontFamily: Fonts.Cairo_Medium,
                  textAlign: "right",
                }}
              >
                نسبة اكتمال الحساب
              </Text>
              <Text
                style={{
                  color: percentage === 100 ? "#15803D" : Colors.primary,
                  fontSize: 12,
                  fontFamily: Fonts.Cairo_Bold,
                }}
              >
                {percentage}%
              </Text>
            </View>

            {/* Progress Track */}
            <View
              className="h-2.5 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: "#F3F4F6" }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor:
                    percentage === 100 ? "#22C55E" : Colors.primary,
                  alignSelf: "flex-end", // Fills from right to left in RTL
                }}
              />
            </View>
          </View>
        </View>

        {/* App Preferences & Actions */}
        <View
          className="rounded-3xl p-2 mb-6"
          style={{
            backgroundColor: Colors.white,
            borderWidth: 1,
            borderColor: "rgba(168, 79, 53, 0.08)",
          }}
        >
          {/* 1. My Orders link */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row-reverse items-center justify-between p-3.5 border-b border-gray-100"
          >
            <View className="flex-1 flex-row-reverse items-center gap-3">
              <View
                className="h-9 w-9 rounded-xl items-center justify-center shrink-0"
                style={{ backgroundColor: Colors.surface }}
              >
                <Package size={18} color={Colors.primary} />
              </View>
              <View className="flex-1 items-end justify-center">
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 14,
                    fontFamily: Fonts.Cairo_Bold,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  طلباتي
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 11,
                    fontFamily: Fonts.Cairo_Regular,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  متابعة وتتبع طلباتك وشحناتك السابقة والحالية
                </Text>
              </View>
            </View>
            <ChevronLeft size={18} color={Colors.textSecondary} style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          {/* 2. Shipping Addresses link */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row-reverse items-center justify-between p-3.5 border-b border-gray-100"
          >
            <View className="flex-1 flex-row-reverse items-center gap-3">
              <View
                className="h-9 w-9 rounded-xl items-center justify-center shrink-0"
                style={{ backgroundColor: Colors.surface }}
              >
                <MapPin size={18} color={Colors.primary} />
              </View>
              <View className="flex-1 items-end justify-center">
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 14,
                    fontFamily: Fonts.Cairo_Bold,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  عناوين التوصيل
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 11,
                    fontFamily: Fonts.Cairo_Regular,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  إدارة عناوين الشحن والاستلام
                </Text>
              </View>
            </View>
            <ChevronLeft size={18} color={Colors.textSecondary} style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          {/* 3. Push Notifications with Animated Switch */}
          <View className="flex-row-reverse items-center justify-between p-3.5 border-b border-gray-100">
            <View className="flex-1 flex-row-reverse items-center gap-3">
              <View
                className="h-9 w-9 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: notificationsEnabled
                    ? Colors.surfaceSelected
                    : Colors.surface,
                }}
              >
                <Bell
                  size={18}
                  color={
                    notificationsEnabled ? Colors.primary : Colors.textSecondary
                  }
                />
              </View>
              <View className="flex-1 items-end">
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 14,
                    fontFamily: Fonts.Cairo_Bold,
                    textAlign: "right",
                  }}
                >
                  إشعارات المتجر
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 11,
                    fontFamily: Fonts.Cairo_Regular,
                    textAlign: "right",
                  }}
                >
                  تحديثات تفصيل الملابس وشحن الطلبات
                </Text>
              </View>
            </View>
            <AnimatedSwitch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
            />
          </View>

          {/* 4. Live Location Services with Animated Switch */}
          <View className="flex-row-reverse items-center justify-between p-3.5">
            <View className="flex-1 flex-row-reverse items-center gap-3">
              <View
                className="h-9 w-9 rounded-xl items-center justify-center"
                style={{
                  backgroundColor: locationEnabled
                    ? Colors.surfaceSelected
                    : Colors.surface,
                }}
              >
                <Navigation
                  size={18}
                  color={
                    locationEnabled ? Colors.primary : Colors.textSecondary
                  }
                />
              </View>
              <View className="flex-1 items-end">
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 14,
                    fontFamily: Fonts.Cairo_Bold,
                    textAlign: "right",
                  }}
                >
                  خدمات الموقع
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 11,
                    fontFamily: Fonts.Cairo_Regular,
                    textAlign: "right",
                  }}
                >
                  تحديد موقعك تلقائياً لدقة وسرعة التوصيل
                </Text>
              </View>
            </View>
            <AnimatedSwitch
              value={locationEnabled}
              onValueChange={handleToggleLocation}
            />
          </View>
        </View>

        {/* Legal & About Dukan Card */}
        <View
          className="rounded-3xl p-2 mb-6"
          style={{
            backgroundColor: Colors.white,
            borderWidth: 1,
            borderColor: "rgba(168, 79, 53, 0.08)",
          }}
        >
          {/* 1. About Dukan */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row-reverse items-center justify-between p-3.5 border-b border-gray-100"
          >
            <View className="flex-1 flex-row-reverse items-center gap-3">
              <View
                className="h-9 w-9 rounded-xl items-center justify-center shrink-0"
                style={{ backgroundColor: Colors.surface }}
              >
                <Info size={18} color={Colors.primary} />
              </View>
              <View className="flex-1 items-end justify-center">
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 14,
                    fontFamily: Fonts.Cairo_Bold,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  عن دكان
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 11,
                    fontFamily: Fonts.Cairo_Regular,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  تعرف أكثر على متجر دكان ورؤيتنا
                </Text>
              </View>
            </View>
            <ChevronLeft size={18} color={Colors.textSecondary} style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          {/* 2. Terms of Services */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row-reverse items-center justify-between p-3.5 border-b border-gray-100"
          >
            <View className="flex-1 flex-row-reverse items-center gap-3">
              <View
                className="h-9 w-9 rounded-xl items-center justify-center shrink-0"
                style={{ backgroundColor: Colors.surface }}
              >
                <FileText size={18} color={Colors.primary} />
              </View>
              <View className="flex-1 items-end justify-center">
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 14,
                    fontFamily: Fonts.Cairo_Bold,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  شروط الخدمة والاستخدام
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 11,
                    fontFamily: Fonts.Cairo_Regular,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  الأحكام والقواعد المنظمة لاستخدام المتجر
                </Text>
              </View>
            </View>
            <ChevronLeft size={18} color={Colors.textSecondary} style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          {/* 3. Privacy Policy */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row-reverse items-center justify-between p-3.5"
          >
            <View className="flex-1 flex-row-reverse items-center gap-3">
              <View
                className="h-9 w-9 rounded-xl items-center justify-center shrink-0"
                style={{ backgroundColor: Colors.surface }}
              >
                <Shield size={18} color={Colors.primary} />
              </View>
              <View className="flex-1 items-end justify-center">
                <Text
                  style={{
                    color: Colors.text,
                    fontSize: 14,
                    fontFamily: Fonts.Cairo_Bold,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  سياسة الخصوصية
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 11,
                    fontFamily: Fonts.Cairo_Regular,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  معلومات حول حماية وأمان بياناتك
                </Text>
              </View>
            </View>
            <ChevronLeft size={18} color={Colors.textSecondary} style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        </View>

        {/* Account Actions Card (Log Out & Delete Account) */}
        <View
          className="rounded-3xl p-2 mb-6"
          style={{
            backgroundColor: Colors.white,
            borderWidth: 1,
            borderColor: "rgba(168, 79, 53, 0.08)",
          }}
        >
          {/* 1. Log Out */}
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isSigningOut || isDeletingAccount}
            onPress={handleSignOut}
            className="flex-row-reverse items-center justify-between p-3.5 border-b border-gray-100"
          >
            <View className="flex-1 flex-row-reverse items-center gap-3">
              <View
                className="h-9 w-9 rounded-xl items-center justify-center shrink-0"
                style={{ backgroundColor: "#FEF2F2" }}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <LogOut size={18} color="#DC2626" />
                )}
              </View>
              <View className="flex-1 items-end justify-center">
                <Text
                  style={{
                    color: "#DC2626",
                    fontSize: 14,
                    fontFamily: Fonts.Cairo_Bold,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  تسجيل الخروج
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 11,
                    fontFamily: Fonts.Cairo_Regular,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  الخروج من حسابك الحالي بأمان
                </Text>
              </View>
            </View>
            <ChevronLeft size={18} color={Colors.textSecondary} style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          {/* 2. Delete Account */}
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isSigningOut || isDeletingAccount}
            onPress={handleDeleteAccount}
            className="flex-row-reverse items-center justify-between p-3.5"
          >
            <View className="flex-1 flex-row-reverse items-center gap-3">
              <View
                className="h-9 w-9 rounded-xl items-center justify-center shrink-0"
                style={{ backgroundColor: "#FEE2E2" }}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="#B91C1C" />
                ) : (
                  <Trash2 size={18} color="#B91C1C" />
                )}
              </View>
              <View className="flex-1 items-end justify-center">
                <Text
                  style={{
                    color: "#B91C1C",
                    fontSize: 14,
                    fontFamily: Fonts.Cairo_Bold,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  حذف الحساب نهائياً
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 11,
                    fontFamily: Fonts.Cairo_Regular,
                    textAlign: "right",
                    width: "100%",
                  }}
                  numberOfLines={1}
                >
                  مسح بياناتك وحسابك نهائياً من المتجر
                </Text>
              </View>
            </View>
            <ChevronLeft size={18} color={Colors.textSecondary} style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        </View>



        {/* Support Team & Contact Channels Card */}
        <View
          className="rounded-3xl p-4 mb-4 items-center"
          style={{
            backgroundColor: Colors.white,
            borderWidth: 1,
            borderColor: "rgba(168, 79, 53, 0.08)",
          }}
        >
          <View className="flex-row-reverse items-center gap-2 mb-1">
            <Headphones size={18} color={Colors.primary} />
            <Text
              style={{
                color: Colors.text,
                fontSize: 14,
                fontFamily: Fonts.Cairo_Bold,
              }}
            >
              فريق الدعم والمساعدة
            </Text>
          </View>

          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 11,
              fontFamily: Fonts.Cairo_Regular,
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            تواصل معنا مباشرة عبر القنوات التالية:
          </Text>

          {/* Contact Action Buttons */}
          <View className="flex-row items-center justify-center gap-3 w-full">
            {/* Phone Call */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenPhone}
              className="flex-1 flex-row items-center justify-center py-2.5 px-2 rounded-2xl"
              style={{
                backgroundColor: "#FDF8F6",
                borderWidth: 1,
                borderColor: "rgba(168, 79, 53, 0.15)",
                gap: 6,
              }}
            >
              <PhoneIcon size={22} />
              <Text
                style={{
                  color: Colors.primary,
                  fontSize: 12,
                  fontFamily: Fonts.Cairo_Bold,
                }}
              >
                اتصال
              </Text>
            </TouchableOpacity>

            {/* WhatsApp */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenWhatsApp}
              className="flex-1 flex-row items-center justify-center py-2.5 px-2 rounded-2xl"
              style={{
                backgroundColor: "#F0FDF4",
                borderWidth: 1,
                borderColor: "rgba(37, 211, 102, 0.25)",
                gap: 6,
              }}
            >
              <WhatsAppIcon size={22} />
              <Text
                style={{
                  color: "#15803D",
                  fontSize: 12,
                  fontFamily: Fonts.Cairo_Bold,
                }}
              >
                واتساب
              </Text>
            </TouchableOpacity>

            {/* Telegram */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenTelegram}
              className="flex-1 flex-row items-center justify-center py-2.5 px-2 rounded-2xl"
              style={{
                backgroundColor: "#F0F9FF",
                borderWidth: 1,
                borderColor: "rgba(0, 136, 204, 0.25)",
                gap: 6,
              }}
            >
              <TelegramIcon size={22} />
              <Text
                style={{
                  color: "#0369A1",
                  fontSize: 12,
                  fontFamily: Fonts.Cairo_Bold,
                }}
              >
                تيليجرام
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contact Number Display */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenPhone}
            className="mt-3.5 pt-3 border-t border-gray-100 w-full flex-row items-center justify-center gap-2"
          >
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: 11,
                fontFamily: Fonts.Cairo_Regular,
              }}
            >
              الرقم المباشر:
            </Text>
            <Text
              style={{
                color: Colors.primary,
                fontSize: 12.5,
                fontFamily: Fonts.Cairo_Bold,
                letterSpacing: 0.5,
                writingDirection: "ltr",
              }}
            >
              00966555475592
            </Text>
          </TouchableOpacity>
        </View>
        {/* Version info */}
        <View className="items-center mb-3">
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 11,
              fontFamily: Fonts.Cairo_Regular,
              opacity: 0.7,
            }}
          >
            متجر دكان • الإصدار 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}