import { useTranslation } from "react-i18next";
import { Text } from "react-native";

export function DukanText({ children, className = "", style, bold = false, ...props }) {
  const { i18n } = useTranslation();
  const rtl = i18n.dir() === "rtl" || i18n.language === "ar";

  return (
    <Text
      {...props}
      className={`text-base text-text ${className}`}
      style={[
        {
          fontFamily: `${rtl ? "Cairo" : "Poppins"}-${bold ? "Bold" : "Regular"}`,
          textAlign: rtl ? "right" : "left",
          writingDirection: rtl ? "rtl" : "ltr",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export default DukanText;
