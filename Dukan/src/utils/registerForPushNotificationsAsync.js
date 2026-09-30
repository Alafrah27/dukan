import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Chat Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    console.log("Checking push notification permissions...");
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log("Existing permission status:", existingStatus);
    if (existingStatus !== "granted") {
      console.log("Requesting push notification permissions...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    console.log("Final permission status:", finalStatus);
    if (finalStatus !== "granted") {
      throw new Error(
        "Permission not granted to get push token for push notification!",
      );
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    
    console.log("Constants.expoConfig.extra.eas.projectId:", Constants?.expoConfig?.extra?.eas?.projectId);
    console.log("Constants.easConfig.projectId:", Constants?.easConfig?.projectId);

    if (!projectId) {
      console.log("Expo Project ID not found in app.json/Constants");
      throw new Error("Project ID not found");
    }
    console.log("Using Project ID for token fetch:", projectId);
    try {
      console.log("Fetching Expo Push Token...");
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      console.log("Token Response received:", tokenResponse);
      const pushTokenString = tokenResponse.data;
      console.log("Push Token String:", pushTokenString);
      return pushTokenString;
    } catch (e) {
      console.error("Error in getExpoPushTokenAsync:", e);
      throw new Error(`${e}`);
    }
  } else {
    console.log("Device.isDevice is false. Push notifications are not supported on emulators.");
    throw new Error("Must use physical device for push notifications");
  }
}