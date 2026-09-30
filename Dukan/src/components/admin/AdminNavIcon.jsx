import Svg, { Circle, Path, Rect } from "react-native-svg";
import colors from "../../constants/Colors";

export default function AdminNavIcon({ name, focused = false, size = 24 }) {
  const color = focused ? colors.primary : colors.textSecondary;
  const fill = focused ? color : "none";
  const detail = focused ? colors.white : color;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {(name === "dashboard" || name === "(drawer)") && (
        <>
          <Rect x="3" y="3" width="7" height="9" rx="1.5" fill={fill} />
          <Rect x="14" y="3" width="7" height="5" rx="1.5" fill={fill} />
          <Rect x="14" y="12" width="7" height="9" rx="1.5" fill={fill} />
          <Rect x="3" y="16" width="7" height="5" rx="1.5" fill={fill} />
        </>
      )}
      {name === "category" && (
        <>
          <Rect x="3" y="3" width="7" height="7" rx="1.5" fill={fill} />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" fill={fill} />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" fill={fill} />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" fill={fill} />
        </>
      )}
      {name === "products" && (
        <>
          <Path
            d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
            fill={fill}
          />
          <Path d="M3.29 7 12 12.01 20.71 7M12 22.08V12" stroke={detail} />
        </>
      )}
      {(name === "orders" || name === "(orders)") && (
        <>
          <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" fill={fill} />
          <Path d="M3 6h18" stroke={detail} />
          <Path d="M16 10a4 4 0 0 1-8 0" stroke={detail} />
        </>
      )}
      {name === "users" && (
        <>
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill={fill} />
          <Circle cx="9" cy="7" r="4" stroke={color} fill={fill} />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={detail} />
        </>
      )}
      {name === "dukan" && (
        <>
          <Path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" fill={fill} />
          <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" fill={fill} />
          <Path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" stroke={detail} />
          <Path d="M2 7h20" stroke={detail} />
        </>
      )}
      {name === "shipping" && (
        <>
          <Path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" fill={fill} />
          <Path d="M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.24-4.05A1 1 0 0 0 17.76 8H14v10h1" fill={fill} />
          <Circle cx="7" cy="18" r="2" stroke={detail} />
          <Circle cx="17" cy="18" r="2" stroke={detail} />
        </>
      )}
      {name === "payments" && (
        <>
          <Rect x="2" y="5" width="20" height="14" rx="2" fill={fill} />
          <Path d="M2 10h20" stroke={detail} />
          <Path d="M6 15h2" stroke={detail} />
        </>
      )}
      {name === "dukannotifications" && (
        <>
          <Path d="M5 10a7 7 0 0 1 14 0v4l2 3H3l2-3Z" fill={fill} />
          <Path d="M9 21h6M12 2v1" stroke={detail} />
        </>
      )}
      {name === "settings" && (
        <>
          <Path
            d="m9 3 1-1h4l1 3 2 1 3-.5 2 3-2 2v3l2 2-2 3-3-.5-2 1-1 3h-4l-1-3-2-1-3 .5-2-3 2-2v-3l-2-2 2-3 3 .5 2-1Z"
            fill={fill}
          />
          <Circle cx="12" cy="12" r="3" stroke={detail} />
        </>
      )}
    </Svg>
  );
}
