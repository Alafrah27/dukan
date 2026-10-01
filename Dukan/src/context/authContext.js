import { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
import Instance from "@/lib/axios";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { NativeModules, I18nManager } from "react-native";

const AuthContext = createContext();

const NOTIFICATIONS_KEY = "@dukan_notifications_enabled";

export const AuthProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load saved notification preference and register if enabled
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        // Load persisted preference
        const saved = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
        const isEnabled = saved === null ? true : saved === "true";

        if (isMounted) setNotificationsEnabled(isEnabled);

        // Only register for push if enabled
        if (isEnabled) {
          try {
            const token = await registerForPushNotificationsAsync();
            if (token && isMounted) {
              setExpoPushToken(token);
            }
          } catch (err) {
            console.warn("Push registration note:", err);
            if (isMounted) setError(err);
          }
        }
      } catch (err) {
        console.warn("Load notification preference error:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Toggle notifications on/off
  const toggleNotifications = useCallback(
    async (enabled) => {
      setNotificationsEnabled(enabled);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, String(enabled));

      if (enabled) {
        // Register for push notifications
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            setExpoPushToken(token);

            // Sync with backend
            try {
              await Instance.put("/user/toggle-notifications", {
                enabled: true,
                expoPushToken: token,
              });
            } catch (apiErr) {
              console.warn("Backend toggle-notifications error:", apiErr);
            }

            Toast.show({
              type: "success",
              text1: "تم تفعيل الإشعارات",
              text2: "ستصلك تحديثات الطلبات والتفصيل",
            });
          }
        } catch (err) {
          console.warn("Push registration error:", err);
          setNotificationsEnabled(false);
          await AsyncStorage.setItem(NOTIFICATIONS_KEY, "false");
          Toast.show({
            type: "error",
            text1: "تعذر تفعيل الإشعارات",
            text2: "يرجى السماح بالإشعارات من إعدادات الهاتف",
          });
        }
      } else {
        // Disable notifications
        setExpoPushToken(null);

        // Sync with backend
        try {
          await Instance.put("/user/toggle-notifications", {
            enabled: false,
          });
        } catch (apiErr) {
          console.warn("Backend toggle-notifications error:", apiErr);
        }

        Toast.show({
          type: "info",
          text1: "تم إيقاف الإشعارات",
          text2: "لن تصلك تحديثات حتى تعيد تفعيلها",
        });
      }
    },
    []
  );

  const changeLanguage = async (lng) => {
    setLoading(true);
    setTimeout(async () => {
      try {
        if (i18n && typeof i18n.changeLanguage === "function") {
          await i18n.changeLanguage(lng);
        }
        await AsyncStorage.setItem("lng", lng);
        I18nManager.allowRTL(lng === "ar");
        I18nManager.forceRTL(lng === "ar");
        if (NativeModules?.DevSettings?.reload) {
          NativeModules.DevSettings.reload();
        }
      } catch (err) {
        console.error("Language change error:", err);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const updateExpoPushToken = async () => {
    if (!expoPushToken) return;
    try {
      const res = await Instance.put("/user/update-expo-push-token", {
        expoPushToken: expoPushToken,
      });
      if (res?.data?.success) {
        Toast.show({
          type: "success",
          text1: "تم تفعيل الإشعارات بنجاح",
        });
      }
    } catch (err) {
      console.warn("Update push token error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        updateExpoPushToken,
        expoPushToken,
        notificationsEnabled,
        toggleNotifications,
        changeLanguage,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      updateExpoPushToken: () => {},
      expoPushToken: null,
      notificationsEnabled: true,
      toggleNotifications: () => {},
      changeLanguage: () => {},
      loading: false,
      error: null,
    };
  }
  return context;
};

export const useAppContext = useAuth;

export default { AuthProvider, useAuth, useAppContext };
