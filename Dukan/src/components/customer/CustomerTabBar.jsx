import { I18nManager, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { DukanText } from "../DukanText";
import CustomerNavIcon from "./CustomerNavIcon";
import colors from "../../constants/Colors";

export default function CustomerTabBar({ state, descriptors, navigation }) {
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  // Arabic is the default language and uses RTL
  const currentLang = i18n?.language || "ar";
  const isRtl =
    (typeof i18n?.dir === "function" ? i18n.dir() === "rtl" : true) ||
    currentLang === "ar";

  // Ensure RTL tab bar direction: Home (الرئيسية) on the far right, Settings on the far left
  const tabRowDirection = isRtl
    ? I18nManager.isRTL
      ? "row"
      : "row-reverse"
    : I18nManager.isRTL
    ? "row-reverse"
    : "row";

  return (
    <View
      className="bg-white"
      style={{
        borderTopWidth: 0,
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingLeft: Math.max(insets.left, 6),
        paddingRight: Math.max(insets.right, 6),
      }}
    >
      <View
        style={{
          flexDirection: tabRowDirection,
          width: "100%",
          maxWidth: 560,
          alignSelf: "center",
        }}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented)
                  navigation.navigate(route.name, route.params);
              }}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              className="flex-1 items-center justify-center py-1 rounded-xl"
              style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
            >
              <View
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                className="h-8 w-12 items-center justify-center rounded-xl mb-1"
                style={{
                  backgroundColor: focused
                    ? colors.surfaceSelected
                    : "transparent",
                }}
              >
                <CustomerNavIcon name={route.name} focused={focused} size={22} />
              </View>
              <DukanText
                bold={focused}
                numberOfLines={1}
                allowFontScaling={false}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{
                  fontSize: 11.5,
                  lineHeight: 18,
                  includeFontPadding: false,
                  textAlign: "center",
                  color: focused ? colors.primary : colors.textSecondary,
                  width: "100%",
                  paddingHorizontal: 1,
                }}
              >
                {label}
              </DukanText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
