import { useTranslation } from "react-i18next";
import { Text } from "react-native";

export function DukanText({
  children,
  className = "",
  style,
  bold = false,
  medium = false,
  extraBold = false,
  weight,
  ...props
}) {
  const { i18n } = useTranslation();
  const rtl =
    (typeof i18n?.dir === "function" ? i18n.dir() === "rtl" : true) ||
    i18n?.language === "ar";

  let variant = "Regular";
  if (weight === "extraBold" || extraBold) {
    variant = "ExtraBold";
  } else if (weight === "bold" || bold) {
    variant = "Bold";
  } else if (weight === "medium" || medium) {
    variant = "Medium";
  }

  const fontFamily = `${rtl ? "Cairo" : "Poppins"}-${variant}`;

  return (
    <Text
      {...props}
      className={`text-text ${className}`}
      style={[
        {
          fontFamily,
          textAlign: rtl ? "right" : "left",
          writingDirection: rtl ? "rtl" : "ltr",
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export default DukanText;
