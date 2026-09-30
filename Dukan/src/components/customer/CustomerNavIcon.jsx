import Svg, { Circle, Path, Rect } from "react-native-svg";
import colors from "../../constants/Colors";

export default function CustomerNavIcon({ name, focused = false, size = 24 }) {
  const color = focused ? colors.primary : colors.textSecondary;
  const fill = focused ? color : "none";
  const detail = focused ? colors.white : color;
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {name === "home" && <>
      <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" fill={fill} />
      <Path d="M9 21v-7h6v7" stroke={detail} />
    </>}
    {name === "category" && <>
      <Rect x="3" y="3" width="7" height="7" rx="2" fill={fill} />
      <Rect x="14" y="3" width="7" height="7" rx="2" fill={fill} />
      <Rect x="3" y="14" width="7" height="7" rx="2" fill={fill} />
      <Rect x="14" y="14" width="7" height="7" rx="2" fill={fill} />
    </>}
    {name === "notifications" && <>
      <Path d="M5 10a7 7 0 0 1 14 0v4l2 3H3l2-3Z" fill={fill} />
      <Path d="M9 21h6M12 2v1" />
    </>}
    {name === "settings" && <>
      <Path d="m9 3 1-1h4l1 3 2 1 3-.5 2 3-2 2v3l2 2-2 3-3-.5-2 1-1 3h-4l-1-3-2-1-3 .5-2-3 2-2v-3l-2-2 2-3 3 .5 2-1Z" fill={fill} />
      <Circle cx="12" cy="12" r="3" stroke={detail} />
    </>}
  </Svg>;
}
