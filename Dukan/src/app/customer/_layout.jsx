import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import CustomerTabBar from "../../components/customer/CustomerTabBar";
import colors from "../../constants/Colors";

export default function CustomerLayout() {
  const { t, i18n } = useTranslation();
  const isRtl =
    (typeof i18n?.dir === "function" ? i18n.dir() === "rtl" : true) ||
    i18n?.language === "ar";

  return (
    <Tabs
      initialRouteName="home"
      backBehavior="history"
      tabBar={(props) => <CustomerTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontFamily: isRtl ? "Cairo-Bold" : "Poppins-Bold",
          fontSize: 18,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t("customerNav.home", "الرئيسية") }}
      />
      <Tabs.Screen
        name="category"
        options={{ title: t("customerNav.category", "الفئات") }}
      />
      <Tabs.Screen
        name="cart"
        options={{ title: t("customerNav.cart", "السلة") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t("customerNav.settings", "الإعدادات") }}
      />
    </Tabs>
  );
}
