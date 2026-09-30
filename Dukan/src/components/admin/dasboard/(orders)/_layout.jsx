import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import colors from "../../../constants/Colors";

export const unstable_settings = { initialRouteName: "orders" };

export default function OrdersLayout() {
    const { t, i18n } = useTranslation();
    return (
        <Stack initialRouteName="orders" screenOptions={{
            headerShown: true,
            animation: "fade",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerTitleAlign: "center",
            headerTitleStyle: {
                fontFamily: i18n.dir() === "rtl" ? "Cairo-Bold" : "Poppins-Bold",
                fontSize: 18,
            },
            contentStyle: { backgroundColor: colors.background },
        }}>
            <Stack.Screen name="orders" options={{ title: t("adminNav.orders") }} />
            <Stack.Screen name="[id]" options={{ title: t("adminNav.orderDetails"), headerBackTitle: t("adminNav.orders") }} />
        </Stack>
    )
}
