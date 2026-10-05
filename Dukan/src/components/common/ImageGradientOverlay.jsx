import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

/**
 * High-performance native gradient overlay using react-native-svg.
 * Adds cinematic depth and readable text contrast over product & offer images.
 */
export default function ImageGradientOverlay({
  topColor = "rgba(0, 0, 0, 0)",
  bottomColor = "rgba(35, 18, 12, 0.88)",
  startOffset = "30%",
  style,
}) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="cardGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={topColor} stopOpacity="0" />
            <Stop offset={startOffset} stopColor={topColor} stopOpacity="0.1" />
            <Stop offset="100%" stopColor={bottomColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#cardGradient)" />
      </Svg>
    </View>
  );
}
