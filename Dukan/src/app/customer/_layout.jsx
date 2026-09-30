import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import CustomerTabBar from "../../components/customer/CustomerTabBar";
import colors from "../../constants/Colors";

export default function CustomerLayout() {
    const { t, i18n } = useTranslation();
    return <Tabs initialRouteName="home" backBehavior="history"
        tabBar={(props) => <CustomerTabBar {...props} />}
        screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerTitleAlign: "center",
            headerTitleStyle: { fontFamily: i18n.dir() === "rtl" ? "Cairo-Bold" : "Poppins-Bold", fontSize: 18 },
            sceneStyle: { backgroundColor: colors.background },
        }}>
        <Tabs.Screen name="home" options={{ title: t("customerNav.home") }} />
        <Tabs.Screen name="category" options={{ title: t("customerNav.category") }} />
        <Tabs.Screen name="notifications" options={{ title: t("customerNav.notifications") }} />
        <Tabs.Screen name="settings" options={{ title: t("customerNav.settings") }} />
    </Tabs>;
}
