import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Star, Edit3, Trash2 } from "lucide-react-native";
import { Colors } from "../../../constants/Colors";
import { Fonts } from "../../../constants/Fonts";

/**
 * Bottom sheet with actions for a saved address (set default / edit / delete).
 */
export default function AddressActionsModal({
  visible,
  onClose,
  address,
  onSetDefault,
  onEdit,
  onDelete,
}) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
          }}
        >
          <View className="items-center pb-2">
            <View className="w-12 h-1.5 bg-gray-200 rounded-full mb-3" />
            <Text
              style={{
                fontFamily: Fonts.Cairo_Bold,
                fontSize: 15,
                color: Colors.text,
              }}
            >
              خيارات العنوان: {address?.title}
            </Text>
          </View>

          <View className="space-y-2 pt-2">
            {/* Set as Default */}
            {!address?.isDefault && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onSetDefault(address)}
                className="flex-row-reverse items-center gap-3 p-3.5 rounded-xl bg-gray-50"
              >
                <Star size={18} color="#D97706" />
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 13,
                    color: Colors.text,
                  }}
                >
                  تعيين كعنوان افتراضي
                </Text>
              </TouchableOpacity>
            )}

            {/* Edit */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onEdit(address)}
              className="flex-row-reverse items-center gap-3 p-3.5 rounded-xl bg-gray-50"
            >
              <Edit3 size={18} color="#3B82F6" />
              <Text
                style={{
                  fontFamily: Fonts.Cairo_Bold,
                  fontSize: 13,
                  color: Colors.text,
                }}
              >
                تعديل تفاصيل العنوان
              </Text>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onDelete(address)}
              className="flex-row-reverse items-center gap-3 p-3.5 rounded-xl bg-red-50"
            >
              <Trash2 size={18} color="#EF4444" />
              <Text
                style={{
                  fontFamily: Fonts.Cairo_Bold,
                  fontSize: 13,
                  color: "#EF4444",
                }}
              >
                حذف العنوان
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
