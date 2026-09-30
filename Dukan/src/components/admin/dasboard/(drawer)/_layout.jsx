import { Drawer } from "expo-router/drawer";
import { useTranslation } from "react-i18next";
import AdminNavIcon from "../../../components/admin/AdminNavIcon";
import colors from "../../../constants/Colors";

export default function DrawerLayout() {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === "rtl";
  return (
    <Drawer
      initialRouteName="dashboard"
      backBehavior="history"
      screenOptions={{
        headerShown: true,
        drawerPosition: rtl ? "right" : "left",
        drawerType: "front",
        overlayAccessibilityLabel: t("adminNav.closeMenu"),
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontFamily: rtl ? "Cairo-Bold" : "Poppins-Bold",
          fontSize: 18,
        },
        drawerActiveTintColor: colors.primary,
        drawerActiveBackgroundColor: colors.surfaceSelected,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: {
          fontFamily: rtl ? "Cairo-Bold" : "Poppins-Bold",
          fontSize: 14,
        },
        drawerStyle: {
          backgroundColor: colors.background,
          width: 280,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          title: t("adminNav.dashboard"),
          drawerLabel: t("adminNav.dashboard"),
          drawerIcon: ({ focused, size }) => (
            <AdminNavIcon name="dashboard" focused={focused} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="category"
        options={{
          title: t("adminNav.category"),
          drawerLabel: t("adminNav.category"),
          drawerIcon: ({ focused, size }) => (
            <AdminNavIcon name="category" focused={focused} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="products"
        options={{
          title: t("adminNav.products"),
          drawerLabel: t("adminNav.products"),
          drawerIcon: ({ focused, size }) => (
            <AdminNavIcon name="products" focused={focused} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="users"
        options={{
          title: t("adminNav.users"),
          drawerLabel: t("adminNav.users"),
          drawerIcon: ({ focused, size }) => (
            <AdminNavIcon name="users" focused={focused} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="dukan"
        options={{
          title: t("adminNav.dukan"),
          drawerLabel: t("adminNav.dukan"),
          drawerIcon: ({ focused, size }) => (
            <AdminNavIcon name="dukan" focused={focused} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="shipping"
        options={{
          title: t("adminNav.shipping"),
          drawerLabel: t("adminNav.shipping"),
          drawerIcon: ({ focused, size }) => (
            <AdminNavIcon name="shipping" focused={focused} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="payments"
        options={{
          title: t("adminNav.payments"),
          drawerLabel: t("adminNav.payments"),
          drawerIcon: ({ focused, size }) => (
            <AdminNavIcon name="payments" focused={focused} size={size} />
          ),
        }}
      />
    </Drawer>
  );
}
