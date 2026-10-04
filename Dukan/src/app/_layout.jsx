import "../lib/i18n";
import React, { useEffect, useState } from "react";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../store/queryClient";
import { AuthProvider } from "../context/authContext";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import Toast from "react-native-toast-message";
import { useSyncUser } from "../store/userQuery";
import "../../global.css";

// Prevent the native splash screen from auto-hiding before auth and font loading are ready
SplashScreen.preventAutoHideAsync().catch(() => { });

// Complete any pending auth sessions on web/native
WebBrowser.maybeCompleteAuthSession();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.warn(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables."
  );
}

function NavigationGate({ fontsLoaded }) {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const { mutate: syncUser } = useSyncUser();

  useEffect(() => {
    if (!fontsLoaded || !isAuthLoaded) {
      return;
    }

    const inAuthGroup =
      segments[0] === "customer" ||
      segments[0] === "address" ||
      segments[0] === "(myorders)";

    if (isSignedIn) {
      try {
        syncUser();
      } catch (_) { }

      if (!inAuthGroup) {
        router.replace("/customer/home");
      }
    } else if (inAuthGroup) {
      router.replace("/");
    }

    setIsReady(true);
    SplashScreen.hideAsync().catch(() => { });
  }, [fontsLoaded, isAuthLoaded, isSignedIn]);

  if (!fontsLoaded || !isAuthLoaded || !isReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="customer" />
      <Stack.Screen name="address" />
      <Stack.Screen name="sso-callback" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Cairo-Bold": require("../../assets/fonts/Cairo-Bold.ttf"),
    "Cairo-ExtraBold": require("../../assets/fonts/Cairo-ExtraBold.ttf"),
    "Cairo-Medium": require("../../assets/fonts/Cairo-Medium.ttf"),
    "Cairo-Regular": require("../../assets/fonts/Cairo-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
  });

  const fontsReady = fontsLoaded || Boolean(fontError);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SafeAreaProvider>
              <StatusBar style="dark" />
              <NavigationGate fontsLoaded={fontsReady} />
              <Toast />
            </SafeAreaProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
