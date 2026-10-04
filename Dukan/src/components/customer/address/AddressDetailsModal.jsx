import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { X, Check, Home, Briefcase, MapPin, Phone, User } from "lucide-react-native";
import { Colors } from "../../../constants/Colors";
import { Fonts } from "../../../constants/Fonts";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const TITLE_CHIPS = [
  { label: "المنزل", icon: Home },
  { label: "العمل", icon: Briefcase },
  { label: "استراحة", icon: MapPin },
];

const labelStyle = {
  fontFamily: Fonts.Cairo_Bold,
  fontSize: 12,
  color: Colors.text,
  textAlign: "right",
  marginBottom: 6,
};

const inputStyle = {
  fontFamily: Fonts.Cairo_Regular,
  fontSize: 13,
  color: Colors.text,
  backgroundColor: "#F9FAFB",
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  textAlign: "right",
};

const iconInputStyle = {
  flex: 1,
  fontFamily: Fonts.Cairo_Regular,
  fontSize: 13,
  color: Colors.text,
  textAlign: "right",
  marginRight: 8,
  padding: 0,
};

function FieldLabel({ children, required }) {
  return (
    <Text style={labelStyle}>
      {children}
      {required ? <Text style={{ color: Colors.primary }}> *</Text> : null}
    </Text>
  );
}

/**
 * Address details form modal.
 *
 * @param {Object} form - { title, recipient, phone, street, district, city, postalCode, country, isDefault }
 * @param {(key: string, value: any) => void} onChange - updates a single form field
 */
export default function AddressDetailsModal({
  visible,
  onClose,
  isEditing,
  form,
  onChange,
  onSubmit,
  isSaving,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 22,
            maxHeight: SCREEN_HEIGHT * 0.88,
          }}
        >
          {/* Header */}
          <View className="flex-row-reverse items-center justify-between pb-3 border-b border-gray-100">
            <Text
              style={{
                fontFamily: Fonts.Cairo_Bold,
                fontSize: 17,
                color: Colors.text,
              }}
            >
              {isEditing ? "تعديل تفاصيل العنوان" : "تفاصيل عنوان التوصيل"}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-gray-100">
              <X size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 16, gap: 16 }}
          >
            {/* Title Chips */}
            <View>
              <Text
                style={{
                  fontFamily: Fonts.Cairo_Bold,
                  fontSize: 13,
                  color: Colors.text,
                  textAlign: "right",
                  marginBottom: 8,
                }}
              >
                نوع العنوان
              </Text>
              <View className="flex-row-reverse gap-2.5">
                {TITLE_CHIPS.map((chip) => {
                  const isSelected = form.title === chip.label;
                  const IconComp = chip.icon;
                  return (
                    <TouchableOpacity
                      key={chip.label}
                      activeOpacity={0.7}
                      onPress={() => onChange("title", chip.label)}
                      style={{
                        flexDirection: "row-reverse",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: isSelected ? Colors.primary : "#F3F4F6",
                      }}
                    >
                      <IconComp size={15} color={isSelected ? "#FFFFFF" : "#4B5563"} />
                      <Text
                        style={{
                          fontFamily: Fonts.Cairo_Bold,
                          fontSize: 12,
                          color: isSelected ? "#FFFFFF" : "#4B5563",
                        }}
                      >
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Recipient Name */}
            <View>
              <FieldLabel>اسم المستلم</FieldLabel>
              <View className="flex-row-reverse items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <User size={16} color="#9CA3AF" />
                <TextInput
                  value={form.recipient}
                  onChangeText={(t) => onChange("recipient", t)}
                  placeholder="مثال: علي إدريس"
                  placeholderTextColor="#9CA3AF"
                  style={iconInputStyle}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View>
              <FieldLabel required>رقم الجوال للتوصيل</FieldLabel>
              <View className="flex-row-reverse items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                <Phone size={16} color="#9CA3AF" />
                <TextInput
                  value={form.phone}
                  onChangeText={(t) => onChange("phone", t)}
                  placeholder="05XXXXXXXX أو +966..."
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                  style={iconInputStyle}
                />
              </View>
            </View>

            {/* Street & Building */}
            <View>
              <FieldLabel required>اسم الشارع ورقم المبنى</FieldLabel>
              <TextInput
                value={form.street}
                onChangeText={(t) => onChange("street", t)}
                placeholder="اسم الشارع - رقم المبنى"
                placeholderTextColor="#9CA3AF"
                style={inputStyle}
              />
            </View>

            {/* District & City */}
            <View className="flex-row-reverse gap-3">
              <View className="flex-1">
                <FieldLabel>الحي</FieldLabel>
                <TextInput
                  value={form.district}
                  onChangeText={(t) => onChange("district", t)}
                  placeholder="اسم الحي"
                  placeholderTextColor="#9CA3AF"
                  style={inputStyle}
                />
              </View>
              <View className="flex-1">
                <FieldLabel required>المدينة</FieldLabel>
                <TextInput
                  value={form.city}
                  onChangeText={(t) => onChange("city", t)}
                  placeholder="اسم المدينة"
                  placeholderTextColor="#9CA3AF"
                  style={inputStyle}
                />
              </View>
            </View>

            {/* Postal Code & Country */}
            <View className="flex-row-reverse gap-3">
              <View className="flex-1">
                <FieldLabel required>الرمز البريدي</FieldLabel>
                <TextInput
                  value={form.postalCode}
                  onChangeText={(t) => onChange("postalCode", t.replace(/[^0-9]/g, ""))}
                  placeholder="مثال: 12345"
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholderTextColor="#9CA3AF"
                  style={inputStyle}
                />
              </View>
              <View className="flex-1">
                <FieldLabel required>الدولة</FieldLabel>
                <TextInput
                  value={form.country}
                  onChangeText={(t) => onChange("country", t)}
                  placeholder="اسم الدولة"
                  placeholderTextColor="#9CA3AF"
                  style={inputStyle}
                />
              </View>
            </View>

            {/* Default Address Checkbox */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onChange("isDefault", !form.isDefault)}
              className="flex-row-reverse items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200"
            >
              <View className="items-end">
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 13,
                    color: Colors.text,
                  }}
                >
                  تعيين كعنوان افتراضي
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Regular,
                    fontSize: 11,
                    color: Colors.textSecondary,
                  }}
                >
                  سيتم اعتماد هذا العنوان تلقائياً لطلباتك القادمة
                </Text>
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: form.isDefault ? Colors.primary : "#D1D5DB",
                  backgroundColor: form.isDefault ? Colors.primary : "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {form.isDefault && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </View>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onSubmit}
              disabled={isSaving}
              style={{
                backgroundColor: Colors.primary,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                opacity: isSaving ? 0.8 : 1,
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    fontFamily: Fonts.Cairo_Bold,
                    fontSize: 15,
                    color: "#FFFFFF",
                  }}
                >
                  {isEditing ? "حفظ التعديلات" : "تأكيد وحفظ العنوان"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
