import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth, useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Svg, { Path } from "react-native-svg";
import { Colors } from "../constants/Colors";
import { Fonts } from "../constants/Fonts";
import { useSyncUser } from "../store/userQuery";

// Complete any pending browser sessions on native/web
WebBrowser.maybeCompleteAuthSession();

// Official 4-color Google G Icon
const GoogleIcon = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.16z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.31 21.43 7.37 24 12 24z"
    />
    <Path
      fill="#FBBC05"
      d="M5.28 14.27a7.2 7.2 0 0 1 0-4.54V6.58H1.27a11.97 11.97 0 0 0 0 10.84l4.01-3.15z"
    />
    <Path
      fill="#EA4335"
      d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.37 0 3.31 2.57 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.96 6.72-4.96z"
    />
  </Svg>
);

// Official Apple Icon
const AppleIcon = ({ size = 22, color = "#FFFFFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 170 170">
    <Path
      fill={color}
      d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.49-9.87-11.75-21.2-15.79-34-4.04-12.8-6.06-24.87-6.06-36.2 0-14.42 3.53-26.68 10.59-36.78 7.06-10.09 16.27-15.23 27.63-15.42 5.02 0 10.68 1.45 16.98 4.35 6.3 2.9 10.33 4.41 12.09 4.54 1.57-.13 5.86-1.74 12.87-4.83 7.01-3.09 12.98-4.51 17.92-4.26 13.59.73 24.38 5.75 32.37 15.06-11.75 7.15-17.5 16.96-17.26 29.43.24 9.69 4.04 17.84 11.4 24.46 7.36 6.62 16.27 10.42 26.73 11.41-2.18 6.53-4.78 13.1-7.8 19.72zm-32.99-106.6c0-7.06 2.54-13.67 7.62-19.83 5.08-6.16 11.41-10.15 18.99-11.97.73 1.82 1.09 3.69 1.09 5.62 0 7.06-2.6 13.82-7.8 20.28-5.2 6.46-11.64 10.46-19.32 12-0.37-2.06-.58-4.1-.58-6.1z"
    />
  </Svg>
);

export default function AuthScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();

  const [loadingProvider, setLoadingProvider] = useState(null); // 'google' | 'apple' | null
  const [errorMessage, setErrorMessage] = useState("");
  const { mutate: syncUser } = useSyncUser();

  // Automatically navigate if user is already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      syncUser();
      router.replace("/customer/home");
    }
  }, [isLoaded, isSignedIn, router, syncUser]);

  // Generic OAuth handler for Google and Apple
  const handleOAuthSignIn = useCallback(
    async (strategy, providerName) => {
      setErrorMessage("");
      setLoadingProvider(providerName);

      try {
        const redirectUrl = AuthSession.makeRedirectUri({
          path: "sso-callback",
        });

        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl,
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          syncUser();
          router.replace("/customer/home");
        }
      } catch (err) {
        console.error(`${providerName} login error:`, err);
        // Do not display error if user deliberately cancelled browser popup
        const isCancelled =
          err?.message?.includes("cancelled") ||
          err?.message?.includes("dismissed") ||
          err?.code === "ERR_REQUEST_CANCELED";

        if (!isCancelled) {
          setErrorMessage(
            "تعذر إتمام تسجيل الدخول في الوقت الحالي، يرجى المحاولة مرة أخرى."
          );
        }
      } finally {
        setLoadingProvider(null);
      }
    },
    [startSSOFlow, router, syncUser]
  );

  // Prevent any flash of the login screen if auth is initializing or user is already signed in
  if (!isLoaded || isSignedIn) {
    return null;
  }

  const isGoogleLoading = loadingProvider === "google";
  const isAppleLoading = loadingProvider === "apple";
  const isAnyLoading = Boolean(loadingProvider);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: Colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingHorizontal: 28,
          paddingVertical: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Section: App Logo & Warm Human Welcoming Header (No Shadows) */}
        <View className="items-center pt-4">
          {/* Logo without shadow */}
          <View className="items-center justify-center">
            <Image
              source={require("../../assets/images/dukan.png")}
              style={{
                width: 130,
                height: 130,
                resizeMode: "contain",
              }}
            />
          </View>

          {/* Welcoming Badge */}
          <View
            className="mt-4 rounded-full px-4 py-1.5"
            style={{ backgroundColor: Colors.surface }}
          >
            <Text
              style={{
                color: Colors.primary,
                fontSize: 13,
                fontFamily: Fonts.Cairo_Bold,
                textAlign: "center",
              }}
            >
              ✨ خياطة وتفصيل وتسوق أصيل
            </Text>
          </View>

          {/* Warm Welcome Title */}
          <Text
            className="mt-4 text-3xl"
            style={{
              color: Colors.text,
              fontFamily: Fonts.Cairo_Bold,
              textAlign: "center",
            }}
          >
            أهلاً بك في دُكّان
          </Text>

          {/* Welcoming Subtitle with Human Touch */}
          <Text
            className="mt-2.5"
            style={{
              color: Colors.textSecondary,
              fontSize: 15,
              fontFamily: Fonts.Cairo_Regular,
              textAlign: "center",
              lineHeight: 24,
              maxWidth: 320,
            }}
          >
            وجهتك الفريدة لتفصيل أرقى الأزياء واقتناء أجود الأقمشة. نسعد بانضمامك،
            سجّل دخولك أو أنشئ حسابك الجديد بلمسة واحدة.
          </Text>
        </View>

        {/* Middle Section: Social Authentication Buttons (Clean & Flat, No Shadows) */}
        <View className="my-8 w-full">
          {/* Error Message banner if any */}
          {errorMessage ? (
            <View
              className="mb-4 rounded-2xl border p-3.5"
              style={{
                backgroundColor: "#FEF2F2",
                borderColor: "#FCA5A5",
              }}
            >
              <Text
                style={{
                  color: "#B91C1C",
                  fontSize: 13,
                  fontFamily: Fonts.Cairo_Medium,
                  textAlign: "center",
                }}
              >
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Google Sign-in Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isAnyLoading}
            onPress={() => handleOAuthSignIn("oauth_google", "google")}
            className="w-full flex-row items-center justify-center rounded-2xl py-4 px-6"
            style={{
              backgroundColor: Colors.white,
              borderWidth: 1.5,
              borderColor: "#E5E7EB",
              opacity: isAnyLoading && !isGoogleLoading ? 0.6 : 1,
            }}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <GoogleIcon size={22} />
                <Text
                  className="ms-3 text-base"
                  style={{
                    color: "#1F2937",
                    fontFamily: Fonts.Cairo_Bold,
                  }}
                >
                  المتابعة باستخدام Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Apple Sign-in Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isAnyLoading}
            onPress={() => handleOAuthSignIn("oauth_apple", "apple")}
            className="mt-3.5 w-full flex-row items-center justify-center rounded-2xl py-4 px-6"
            style={{
              backgroundColor: "#000000",
              opacity: isAnyLoading && !isAppleLoading ? 0.6 : 1,
            }}
          >
            {isAppleLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <AppleIcon size={22} color="#FFFFFF" />
                <Text
                  className="ms-3 text-base"
                  style={{
                    color: "#FFFFFF",
                    fontFamily: Fonts.Cairo_Bold,
                  }}
                >
                  المتابعة باستخدام Apple
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Subtle Security Badge */}
          <View className="mt-5 flex-row items-center justify-center">
            <Text
              style={{
                color: Colors.textSecondary,
                fontSize: 12,
                fontFamily: Fonts.Cairo_Medium,
              }}
            >
              🔒 تسجيل دخول فوري ومشفّر وآمن
            </Text>
          </View>
        </View>

        {/* Bottom Section: Terms & Conditions Footnote */}
        <View className="items-center pb-2">
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 11,
              fontFamily: Fonts.Cairo_Regular,
              textAlign: "center",
              lineHeight: 18,
              maxWidth: 300,
            }}
          >
            بمتابعة تسجيل الدخول، فإنك توافق على{" "}
            <Text
              style={{
                color: Colors.primary,
                fontFamily: Fonts.Cairo_Bold,
              }}
            >
              شروط الاستخدام
            </Text>{" "}
            و{" "}
            <Text
              style={{
                color: Colors.primary,
                fontFamily: Fonts.Cairo_Bold,
              }}
            >
              سياسة الخصوصية
            </Text>{" "}
            الخاصة بمتجر دكان.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
