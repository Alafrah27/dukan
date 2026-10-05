import { Dimensions, PixelRatio } from "react-native";

/**
 * Responsive scaling helpers.
 * Base guideline: standard ~5" device (iPhone 11 Pro / X: 375 x 812).
 */
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

// Prevent oversized UI on tablets / very large screens
const MAX_SCALE_FACTOR = 1.35;

const { width, height } = Dimensions.get("window");
const [shortDimension, longDimension] =
  width < height ? [width, height] : [height, width];

const widthFactor = Math.min(shortDimension / GUIDELINE_BASE_WIDTH, MAX_SCALE_FACTOR);
const heightFactor = Math.min(longDimension / GUIDELINE_BASE_HEIGHT, MAX_SCALE_FACTOR);

const round = (value) => PixelRatio.roundToNearestPixel(value);

/** Scale horizontally (widths, horizontal paddings/margins, icon sizes). */
export const scale = (size) => round(size * widthFactor);

/** Scale vertically (heights, vertical paddings/margins). */
export const verticalScale = (size) => round(size * heightFactor);

/** Scale with a dampening factor (radius, gaps, general spacing). */
export const moderateScale = (size, factor = 0.5) =>
  round(size + (scale(size) - size) * factor);

/** Font sizes — scaled gently so text stays readable on all devices. */
export const fontScale = (size) => moderateScale(size, 0.3);

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

// Short aliases (common convention)
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;
