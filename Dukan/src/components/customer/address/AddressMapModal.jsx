import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleMaps, AppleMaps } from "expo-maps";
import { ArrowRight, MapPin, Navigation } from "lucide-react-native";
import { Colors } from "../../../constants/Colors";
import { Fonts } from "../../../constants/Fonts";

const MapComponent = Platform.OS === "ios" ? AppleMaps.View : GoogleMaps.View;

/**
 * Full-screen map modal for picking a delivery location.
 * The camera is controlled only via `cameraTarget` (programmatic moves);
 * user drags are reported through `onCameraMove`.
 */
export default function AddressMapModal({
  visible,
  onClose,
  cameraTarget,
  onCameraMove,
  locationInfo,
  isGeocoding,
  isLocating,
  onGetCurrentLocation,
  onProceed,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        {/* Map View */}
        <View style={{ flex: 1, position: "relative" }}>
          {MapComponent ? (
            <MapComponent
              style={{ width: "100%", height: "100%" }}
              cameraPosition={cameraTarget}
              onCameraMove={onCameraMove}
              properties={{
                isMyLocationEnabled: true,
              }}
              uiSettings={{
                myLocationButtonEnabled: false,
                compassEnabled: false,
              }}
            />
          ) : (
            <View className="flex-1 bg-slate-100 items-center justify-center p-6">
              <MapPin size={40} color={Colors.primary} />
              <Text
                style={{
                  fontFamily: Fonts.Cairo_Bold,
                  fontSize: 14,
                  color: Colors.text,
                  marginTop: 12,
                }}
              >
                {locationInfo.displayTitle}
              </Text>
            </View>
          )}

          {/* ── Top Floating Back Button ── */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            <ArrowRight size={22} color="#1F2937" />
          </TouchableOpacity>

          {/* ── Fixed Center Pin & Tooltip Bubble ── */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 140,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Tooltip bubble */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.Cairo_Bold,
                  fontSize: 13,
                  color: "#1F2937",
                  textAlign: "center",
                }}
              >
                سيتم توصيل طلبك إلى هذا الموقع
              </Text>
              {/* Pointer triangle */}
              <View
                style={{
                  position: "absolute",
                  bottom: -6,
                  alignSelf: "center",
                  width: 0,
                  height: 0,
                  borderLeftWidth: 6,
                  borderRightWidth: 6,
                  borderTopWidth: 6,
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderTopColor: "#FFFFFF",
                }}
              />
            </View>

            {/* Black Pin icon */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#111827",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 5,
                elevation: 5,
              }}
            >
              <MapPin size={22} color="#FFFFFF" />
            </View>

            {/* Blue pulse dot underneath */}
            <View
              style={{
                width: 16,
                height: 6,
                borderRadius: 8,
                backgroundColor: "rgba(37, 99, 235, 0.45)",
                marginTop: 2,
              }}
            />
          </View>

          {/* ── Floating "الموقع الحالي" Button ── */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onGetCurrentLocation}
            disabled={isLocating}
            style={{
              position: "absolute",
              bottom: 175,
              alignSelf: "center",
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
              borderWidth: 1,
              borderColor: "#F3F4F6",
            }}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <Navigation size={16} color="#111827" />
            )}
            <Text
              style={{
                fontFamily: Fonts.Cairo_Bold,
                fontSize: 13,
                color: "#111827",
              }}
            >
              الموقع الحالي
            </Text>
          </TouchableOpacity>

          {/* ── Bottom Sheet Card ── */}
          <View
            style={{
              position: "absolute",
              bottom: 20,
              left: 16,
              right: 16,
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 18,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#111827",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MapPin size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 16,
                    color: "#111827",
                    textAlign: "right",
                  }}
                  numberOfLines={1}
                >
                  {isGeocoding ? "جارٍ تحديد العنوان..." : locationInfo.displayTitle}
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Regular,
                    fontSize: 12,
                    color: "#6B7280",
                    textAlign: "right",
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {locationInfo.displaySubtitle}
                </Text>
              </View>
            </View>

            {/* Add Address Details Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onProceed}
              style={{
                marginTop: 16,
                backgroundColor: "#1F242F",
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.Cairo_Bold,
                  fontSize: 15,
                  color: "#FFFFFF",
                }}
              >
                أضف تفاصيل العنوان
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
