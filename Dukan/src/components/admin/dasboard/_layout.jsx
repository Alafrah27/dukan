import { LocaleProvider, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import AdminTabBar from "../AdminTabBar";
import colors from "../../../constants/Colors";

export default function DashboardLayout() {
  const { t, i18n } = useTranslation();

  return (
    <LocaleProvider direction={i18n.dir()}>
      <Tabs
        initialRouteName="(drawer)"
        backBehavior="history"
        tabBar={(props) => <AdminTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontFamily: i18n.dir() === "rtl" ? "Cairo-Bold" : "Poppins-Bold",
            fontSize: 18,
          },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >

        <Tabs.Screen
          name="(drawer)"
          options={{ title: t("adminNav.dashboard") }}
        />
        <Tabs.Screen
          name="(orders)"
          options={{ title: t("adminNav.orders") }}
        />

        <Tabs.Screen
          name="dukannotifications"
          options={{ title: t("adminNav.notifications"), headerShown: true }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: t("adminNav.settings"), headerShown: true }}
        />
      </Tabs>
    </LocaleProvider>
  );
}
