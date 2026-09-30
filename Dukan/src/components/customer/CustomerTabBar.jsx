import { I18nManager, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { DukanText } from "../DukanText";
import CustomerNavIcon from "./CustomerNavIcon";
import colors from "../../constants/Colors";

export default function CustomerTabBar({ state, descriptors, navigation }) {
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const rtl = i18n.dir() === "rtl";
  return <View className="border-t border-surface bg-white px-3 pt-2"
    style={{ paddingBottom: Math.max(insets.bottom, 12), paddingLeft: Math.max(insets.left, 12), paddingRight: Math.max(insets.right, 12) }}>
    <View style={{ flexDirection: "row", width: "100%", maxWidth: 560, alignSelf: "center" }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        return <Pressable key={route.key} accessibilityRole="tab"
          accessibilityLabel={label} accessibilityState={{ selected: focused }}
          onPress={() => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          }}
          onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
          className="min-h-[68px] flex-1 items-center justify-center gap-1 rounded-xl"
          style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}>
          <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
            className="h-9 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: focused ? colors.surfaceSelected : "transparent" }}>
            <CustomerNavIcon name={route.name} focused={focused} />
          </View>
          <DukanText bold={focused} numberOfLines={1} style={{ fontSize: 11, textAlign: "center", color: focused ? colors.primary : colors.textSecondary }}>
            {label}
          </DukanText>
        </Pressable>;
      })}
    </View>
  </View>;
}
