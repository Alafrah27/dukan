import React, { useEffect } from "react";
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
import {
  X,
  Check,
  Home,
  Briefcase,
  MapPin,
  Phone,
  User,
  AlertCircle,
} from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import { Colors } from "../../../constants/Colors";
import { Fonts } from "../../../constants/Fonts";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const TITLE_CHIPS = [
  { label: "المنزل", icon: Home },
  { label: "العمل", icon: Briefcase },
  { label: "استراحة", icon: MapPin },
];

function FieldLabel({ children, required, hasError }) {
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
      }}
    >
      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
        <Text
          style={{
            fontFamily: Fonts.Cairo_Bold,
            fontSize: 12,
            color: hasError ? "#DC2626" : Colors.text,
            textAlign: "right",
          }}
        >
          {children}
        </Text>
        {required && (
          <Text
            style={{
              fontFamily: Fonts.Cairo_Bold,
              fontSize: 14,
              color: "#DC2626",
            }}
          >
            *
          </Text>
        )}
      </View>

      {required && (
        <View
          style={{
            backgroundColor: hasError ? "#FEE2E2" : "#F3F4F6",
            paddingHorizontal: 7,
            paddingVertical: 1.5,
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.Cairo_Medium,
              fontSize: 10,
              color: hasError ? "#DC2626" : Colors.textSecondary,
            }}
          >
            مطلوب
          </Text>
        </View>
      )}
    </View>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 4,
        marginTop: 5,
        paddingHorizontal: 2,
      }}
    >
      <AlertCircle size={13} color="#DC2626" />
      <Text
        style={{
          flex: 1,
          fontFamily: Fonts.Cairo_Medium,
          fontSize: 11,
          color: "#DC2626",
          textAlign: "right",
        }}
      >
        {error.message}
      </Text>
    </View>
  );
}

const baseInputStyle = {
  fontFamily: Fonts.Cairo_Regular,
  fontSize: 13,
  color: Colors.text,
  backgroundColor: "#F9FAFB",
  borderWidth: 1.5,
  borderColor: "#E5E7EB",
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  textAlign: "right",
};

const baseIconContainerStyle = {
  flexDirection: "row-reverse",
  alignItems: "center",
  backgroundColor: "#F9FAFB",
  borderWidth: 1.5,
  borderColor: "#E5E7EB",
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
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

/**
 * Address details form modal with react-hook-form validation.
 *
 * @param {boolean} visible - modal visibility
 * @param {() => void} onClose - close modal handler
 * @param {boolean} isEditing - edit mode flag
 * @param {Object} form - initial form values { title, recipient, phone, street, district, city, postalCode, country, isDefault }
 * @param {(key: string, value: any) => void} onChange - updates a single form field in parent
 * @param {(validatedData: Object) => void} onSubmit - submit valid form values
 * @param {boolean} isSaving - saving state flag
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
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: form?.title || "المنزل",
      recipient: form?.recipient || "",
      phone: form?.phone || "",
      street: form?.street || "",
      district: form?.district || "",
      city: form?.city || "",
      postalCode: form?.postalCode || "",
      country: form?.country || "",
      isDefault: Boolean(form?.isDefault),
    },
    mode: "onTouched",
  });

  // Reset form values whenever modal opens or switching between addresses
  useEffect(() => {
    if (visible) {
      reset({
        title: form?.title || "المنزل",
        recipient: form?.recipient || "",
        phone: form?.phone || "",
        street: form?.street || "",
        district: form?.district || "",
        city: form?.city || "",
        postalCode: form?.postalCode || "",
        country: form?.country || "",
        isDefault: Boolean(form?.isDefault),
      });
    }
  }, [visible, reset]);

  const onValidSubmit = (data) => {
    onSubmit?.(data);
  };

  const onInvalidSubmit = (formErrors) => {
    const errorCount = Object.keys(formErrors).length;
    Toast.show({
      type: "error",
      text1: "يرجى تعبئة جميع الحقول المطلوبة",
      text2: `هناك ${errorCount} ${
        errorCount === 1 ? "حقل مطلوب يجب إكماله" : "حقول مطلوبة يجب إكمالها"
      }`,
    });
  };

  const hasAnyErrors = Object.keys(errors).length > 0;

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
            contentContainerStyle={{ paddingTop: 16, gap: 14 }}
          >
            {/* Global Warning Banner when errors exist */}
            {hasAnyErrors && (
              <View
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "#FEF2F2",
                  borderWidth: 1,
                  borderColor: "#FCA5A5",
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <AlertCircle size={18} color="#DC2626" />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: Fonts.Cairo_Medium,
                    fontSize: 12,
                    color: "#DC2626",
                    textAlign: "right",
                  }}
                >
                  يرجى تعبئة الحقول المطلوبة المحددة باللون الأحمر لإكمال الحفظ
                </Text>
              </View>
            )}

            {/* Address Type Chips */}
            <View>
              <FieldLabel required>نوع العنوان</FieldLabel>
              <Controller
                control={control}
                name="title"
                defaultValue="المنزل"
                render={({ field: { value, onChange: onFieldChange } }) => (
                  <View className="flex-row-reverse gap-2.5">
                    {TITLE_CHIPS.map((chip) => {
                      const isSelected = value === chip.label;
                      const IconComp = chip.icon;
                      return (
                        <TouchableOpacity
                          key={chip.label}
                          activeOpacity={0.7}
                          onPress={() => {
                            onFieldChange(chip.label);
                            onChange?.("title", chip.label);
                          }}
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
                )}
              />
            </View>

            {/* Recipient Name */}
            <View>
              <Controller
                control={control}
                name="recipient"
                rules={{
                  required: "اسم المستلم مطلوب للتوصيل",
                  minLength: {
                    value: 2,
                    message: "اسم المستلم يجب أن يتكون من حرفين على الأقل",
                  },
                }}
                render={({
                  field: { onChange: onFieldChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <View>
                    <FieldLabel required hasError={Boolean(error)}>
                      اسم المستلم
                    </FieldLabel>
                    <View
                      style={[
                        baseIconContainerStyle,
                        error && { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
                      ]}
                    >
                      <User size={16} color={error ? "#DC2626" : "#9CA3AF"} />
                      <TextInput
                        value={value}
                        onChangeText={(t) => {
                          onFieldChange(t);
                          onChange?.("recipient", t);
                        }}
                        onBlur={onBlur}
                        placeholder="مثال: علي إدريس"
                        placeholderTextColor="#9CA3AF"
                        style={iconInputStyle}
                      />
                    </View>
                    <FieldError error={error} />
                  </View>
                )}
              />
            </View>

            {/* Phone Number */}
            <View>
              <Controller
                control={control}
                name="phone"
                rules={{
                  required: "رقم الجوال مطلوب للتواصل عند التوصيل",
                  validate: (val) => {
                    if (!val || !val.trim()) return "رقم الجوال مطلوب للتواصل عند التوصيل";
                    const clean = val.replace(/[\s-]/g, "");
                    if (!/^[0-9+]{8,15}$/.test(clean)) {
                      return "يرجى إدخال رقم جوال صحيح (أرقام فقط)";
                    }
                    if (clean.replace("+", "").length < 8) {
                      return "رقم الجوال قصير جداً";
                    }
                    return true;
                  },
                }}
                render={({
                  field: { onChange: onFieldChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <View>
                    <FieldLabel required hasError={Boolean(error)}>
                      رقم الجوال للتوصيل
                    </FieldLabel>
                    <View
                      style={[
                        baseIconContainerStyle,
                        error && { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
                      ]}
                    >
                      <Phone size={16} color={error ? "#DC2626" : "#9CA3AF"} />
                      <TextInput
                        value={value}
                        onChangeText={(t) => {
                          onFieldChange(t);
                          onChange?.("phone", t);
                        }}
                        onBlur={onBlur}
                        placeholder="05XXXXXXXX أو +966..."
                        keyboardType="phone-pad"
                        placeholderTextColor="#9CA3AF"
                        style={iconInputStyle}
                      />
                    </View>
                    <FieldError error={error} />
                  </View>
                )}
              />
            </View>

            {/* Street & Building */}
            <View>
              <Controller
                control={control}
                name="street"
                rules={{
                  required: "اسم الشارع ورقم المبنى مطلوب",
                  minLength: {
                    value: 3,
                    message: "يرجى كتابة تفاصيل الشارع والمبنى (3 أحرف على الأقل)",
                  },
                }}
                render={({
                  field: { onChange: onFieldChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <View>
                    <FieldLabel required hasError={Boolean(error)}>
                      اسم الشارع ورقم المبنى
                    </FieldLabel>
                    <TextInput
                      value={value}
                      onChangeText={(t) => {
                        onFieldChange(t);
                        onChange?.("street", t);
                      }}
                      onBlur={onBlur}
                      placeholder="اسم الشارع - رقم المبنى"
                      placeholderTextColor="#9CA3AF"
                      style={[
                        baseInputStyle,
                        error && { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
                      ]}
                    />
                    <FieldError error={error} />
                  </View>
                )}
              />
            </View>

            {/* District & City */}
            <View className="flex-row-reverse gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="district"
                  rules={{
                    required: "اسم الحي مطلوب",
                    minLength: {
                      value: 2,
                      message: "اسم الحي يجب أن يتكون من حرفين على الأقل",
                    },
                  }}
                  render={({
                    field: { onChange: onFieldChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <View>
                      <FieldLabel required hasError={Boolean(error)}>
                        الحي
                      </FieldLabel>
                      <TextInput
                        value={value}
                        onChangeText={(t) => {
                          onFieldChange(t);
                          onChange?.("district", t);
                        }}
                        onBlur={onBlur}
                        placeholder="اسم الحي"
                        placeholderTextColor="#9CA3AF"
                        style={[
                          baseInputStyle,
                          error && { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
                        ]}
                      />
                      <FieldError error={error} />
                    </View>
                  )}
                />
              </View>

              <View className="flex-1">
                <Controller
                  control={control}
                  name="city"
                  rules={{
                    required: "اسم المدينة مطلوب",
                    minLength: {
                      value: 2,
                      message: "اسم المدينة يجب أن يتكون من حرفين على الأقل",
                    },
                  }}
                  render={({
                    field: { onChange: onFieldChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <View>
                      <FieldLabel required hasError={Boolean(error)}>
                        المدينة
                      </FieldLabel>
                      <TextInput
                        value={value}
                        onChangeText={(t) => {
                          onFieldChange(t);
                          onChange?.("city", t);
                        }}
                        onBlur={onBlur}
                        placeholder="اسم المدينة"
                        placeholderTextColor="#9CA3AF"
                        style={[
                          baseInputStyle,
                          error && { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
                        ]}
                      />
                      <FieldError error={error} />
                    </View>
                  )}
                />
              </View>
            </View>

            {/* Postal Code & Country */}
            <View className="flex-row-reverse gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="postalCode"
                  rules={{
                    required: "الرمز البريدي مطلوب",
                    validate: (val) => {
                      if (!val || !val.trim()) return "الرمز البريدي مطلوب";
                      const digits = val.replace(/[^0-9]/g, "");
                      if (digits.length < 4 || digits.length > 10) {
                        return "الرمز البريدي بين 4 و10 أرقام";
                      }
                      return true;
                    },
                  }}
                  render={({
                    field: { onChange: onFieldChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <View>
                      <FieldLabel required hasError={Boolean(error)}>
                        الرمز البريدي
                      </FieldLabel>
                      <TextInput
                        value={value}
                        onChangeText={(t) => {
                          const digitsOnly = t.replace(/[^0-9]/g, "");
                          onFieldChange(digitsOnly);
                          onChange?.("postalCode", digitsOnly);
                        }}
                        onBlur={onBlur}
                        placeholder="مثال: 12345"
                        keyboardType="number-pad"
                        maxLength={10}
                        placeholderTextColor="#9CA3AF"
                        style={[
                          baseInputStyle,
                          error && { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
                        ]}
                      />
                      <FieldError error={error} />
                    </View>
                  )}
                />
              </View>

              <View className="flex-1">
                <Controller
                  control={control}
                  name="country"
                  rules={{
                    required: "اسم الدولة مطلوب",
                    minLength: {
                      value: 2,
                      message: "اسم الدولة يجب أن يتكون من حرفين على الأقل",
                    },
                  }}
                  render={({
                    field: { onChange: onFieldChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <View>
                      <FieldLabel required hasError={Boolean(error)}>
                        الدولة
                      </FieldLabel>
                      <TextInput
                        value={value}
                        onChangeText={(t) => {
                          onFieldChange(t);
                          onChange?.("country", t);
                        }}
                        onBlur={onBlur}
                        placeholder="اسم الدولة"
                        placeholderTextColor="#9CA3AF"
                        style={[
                          baseInputStyle,
                          error && { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
                        ]}
                      />
                      <FieldError error={error} />
                    </View>
                  )}
                />
              </View>
            </View>

            {/* Default Address Checkbox */}
            <Controller
              control={control}
              name="isDefault"
              render={({ field: { onChange: onFieldChange, value } }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    const nextVal = !value;
                    onFieldChange(nextVal);
                    onChange?.("isDefault", nextVal);
                  }}
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
                      borderColor: value ? Colors.primary : "#D1D5DB",
                      backgroundColor: value ? Colors.primary : "#FFFFFF",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {value && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmit(onValidSubmit, onInvalidSubmit)}
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
