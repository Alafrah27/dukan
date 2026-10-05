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
import api from "@/lib/axios";

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

  useEffect(() => {
    if (!fontsLoaded || !isAuthLoaded) {
      return;
    }

    const isLandingOrLogin = !segments[0] || segments[0] === "index";
    const isPublicRoute = isLandingOrLogin || segments[0] === "sso-callback";

    if (isSignedIn) {
      // Sync user profile in backend silently
      api.post("/user", {}).catch(() => { });

      // Only redirect signed-in users away from the landing / sign-in screen
      if (isLandingOrLogin) {
        const timer = setTimeout(() => {
          router.replace("/customer/home");
        }, 0);
        return () => clearTimeout(timer);
      }
    } else if (!isPublicRoute) {
      // Redirect unauthenticated users away from protected screens to login
      const timer = setTimeout(() => {
        router.replace("/");
      }, 0);
      return () => clearTimeout(timer);
    }

    SplashScreen.hideAsync().catch(() => { });
  }, [fontsLoaded, isAuthLoaded, isSignedIn, segments]);

  if (!fontsLoaded || !isAuthLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="customer" />
      <Stack.Screen name="address" />
      <Stack.Screen name="sso-callback" />
      <Stack.Screen name="search" />
      <Stack.Screen name="[id]" />
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
