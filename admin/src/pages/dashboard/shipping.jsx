import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Package,
  FileText,
  MapPin,
  Truck,
  Calculator,
  Weight,
  Ruler,
  Globe,
  Building2,
  Mail,
  ArrowLeft,
  Loader2,
  BadgeCheck,
  Clock,
  Banknote,
  Info,
} from "lucide-react";
import { useCalculateShippingRate, useGetShippingCountries } from "../../services/shippingQuery";
import showToast from "../../lib/toast";

// Fallback initial list while fetching from Aramex API
const DEFAULT_COUNTRIES = [
  { code: "SA", nameAr: "المملكة العربية السعودية", zone: "gcc" },
  { code: "AE", nameAr: "الإمارات العربية المتحدة", zone: "gcc" },
  { code: "KW", nameAr: "الكويت", zone: "gcc" },
  { code: "BH", nameAr: "البحرين", zone: "gcc" },
  { code: "QA", nameAr: "قطر", zone: "gcc" },
  { code: "OM", nameAr: "عُمان", zone: "gcc" },
  { code: "EG", nameAr: "جمهورية مصر العربية", zone: "arab" },
  { code: "JO", nameAr: "المملكة الأردنية الهاشمية", zone: "arab" },
  { code: "SD", nameAr: "السودان", zone: "arab" },
  { code: "US", nameAr: "الولايات المتحدة الأمريكية", zone: "international" },
  { code: "GB", nameAr: "المملكة المتحدة", zone: "international" },
];

function Shipping() {
  const [quoteResult, setQuoteResult] = useState(null);
  const { mutateAsync: calculateRate, isPending } = useCalculateShippingRate();
  const { data: serverCountries, isLoading: isLoadingCountries } = useGetShippingCountries();

  const countries = serverCountries && serverCountries.length > 0 ? serverCountries : DEFAULT_COUNTRIES;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      shipmentType: "parcel", // 'document' or 'parcel'
      countryCode: "",
      city: "",
      postalCode: "",
      weight: 1,
      length: 45, // Fixed 45cm box standard
      width: 45,
      height: 45,
      numberOfPieces: 1,
    },
  });

  const selectedCountry = watch("countryCode");
  const shipmentType = watch("shipmentType");
  const weight = Number(watch("weight")) || 1;
  const length = Number(watch("length")) || 0;
  const width = Number(watch("width")) || 0;
  const height = Number(watch("height")) || 0;

  // Aramex volumetric weight calculation
  const volumetricWeight = length && width && height ? (length * width * height) / 5000 : 0;
  const chargeableWeight = Math.max(weight, volumetricWeight);

  const onSubmit = async (data) => {
    try {
      const result = await calculateRate({
        destination: {
          countryCode: data.countryCode,
          city: data.city,
          postalCode: data.postalCode,
        },
        packageDetails: {
          shipmentType: data.shipmentType,
          weight: Number(data.weight),
          length: Number(data.length),
          width: Number(data.width),
          height: Number(data.height),
          numberOfPieces: Number(data.numberOfPieces),
        },
        currency: "SAR",
      });

      if (result.success && result.quotes?.length > 0) {
        setQuoteResult(result.quotes[0]);
        showToast.success("تم احتساب تكلفة الشحن بنجاح");
      } else {
        showToast.error("لم يتم العثور على أسعار شحن متاحة");
      }
    } catch (error) {
      showToast.error(error.response?.data?.message || "حدث خطأ أثناء حساب تكلفة الشحن");
      setQuoteResult(null);
    }
  };

  const handleReset = () => {
    reset({
      shipmentType: "parcel",
      countryCode: "",
      city: "",
      postalCode: "",
      weight: 1,
      length: 45,
      width: 45,
      height: 45,
      numberOfPieces: 1,
    });
    setQuoteResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Truck size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">حاسبة الشحن</h1>
          <p className="text-sm text-textSecondary">
            احسب تكلفة الشحن من المملكة العربية السعودية إلى أي وجهة
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form Section */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Origin (Fixed) */}
            <div className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-text">
                <MapPin size={16} className="text-primary" />
                مكان الشحن (الأصل)
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-surface/50 px-4 py-3">
                <span className="text-lg">🇸🇦</span>
                <div>
                  <p className="text-sm font-semibold text-text">المملكة العربية السعودية - الرياض</p>
                  <p className="text-xs text-textSecondary">مركز دكان للشحن والتوزيع</p>
                </div>
                <BadgeCheck size={16} className="mr-auto text-green-500" />
              </div>
            </div>

            {/* Destination */}
            <div className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-text">
                <Globe size={16} className="text-primary" />
                وجهة الشحن
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="countryCode" className="mb-1.5 block text-xs font-semibold text-textSecondary">
                    الدولة *
                  </label>
                  <select
                    id="countryCode"
                    {...register("countryCode", { required: "يرجى اختيار الدولة" })}
                    className="w-full rounded-lg border border-primary/15 bg-white px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">
                      {isLoadingCountries ? "جارٍ تحميل قائمة الدول من أرامكس..." : "اختر الدولة..."}
                    </option>
                    <optgroup label="الشحن المحلي (المملكة العربية السعودية)">
                      {countries.filter((c) => c.code === "SA").map((c) => (
                        <option key={c.code} value={c.code}>
                          🇸🇦 {c.nameAr || c.nameEn}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="دول مجلس التعاون الخليجي">
                      {countries.filter((c) => c.zone === "gcc" && c.code !== "SA").map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.nameAr || c.nameEn}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="الدول العربية والإقليمية">
                      {countries.filter((c) => c.zone === "arab" && c.code !== "SA").map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.nameAr || c.nameEn}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="الشحن الدولي">
                      {countries.filter((c) => c.zone === "international" && c.code !== "SA").map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.nameAr || c.nameEn}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {errors.countryCode && (
                    <p className="mt-1 text-xs text-red-500">{errors.countryCode.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="mb-1.5 block text-xs font-semibold text-textSecondary">
                    المدينة
                  </label>
                  <div className="relative">
                    <Building2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary" />
                    <input
                      id="city"
                      type="text"
                      placeholder="مثال: منشيستر / لندن / دبي"
                      {...register("city")}
                      className="w-full rounded-lg border border-primary/15 bg-white py-2.5 pr-9 pl-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="postalCode" className="mb-1.5 block text-xs font-semibold text-textSecondary">
                    الرمز البريدي (Postal Code)
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary" />
                    <input
                      id="postalCode"
                      type="text"
                      placeholder="مثال: M1 1AE أو 11564"
                      {...register("postalCode")}
                      className="w-full rounded-lg border border-primary/15 bg-white py-2.5 pr-9 pl-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Type & Details */}
            <div className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-text">
                  <Package size={16} className="text-primary" />
                  نوع وتفاصيل الشحنة
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    مقاس الصندوق الثابت: 45 سم
                  </span>
                </div>

                {/* Aramex Document vs Parcel selector */}
                <div className="flex items-center rounded-lg border border-primary/15 bg-surface/40 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setValue("shipmentType", "document")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                      shipmentType === "document"
                        ? "bg-primary text-white shadow-sm"
                        : "text-textSecondary hover:text-text"
                    }`}
                  >
                    <FileText size={13} />
                    مستندات (Document)
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("shipmentType", "parcel")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                      shipmentType === "parcel"
                        ? "bg-primary text-white shadow-sm"
                        : "text-textSecondary hover:text-text"
                    }`}
                  >
                    <Package size={13} />
                    طرد (Parcel)
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Weight */}
                <div>
                  <label htmlFor="weight" className="mb-1.5 block text-xs font-semibold text-textSecondary">
                    الوزن (كجم) *
                  </label>
                  <div className="relative">
                    <Weight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary" />
                    <input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      {...register("weight", {
                        required: "الوزن مطلوب",
                        min: { value: 0.1, message: "الحد الأدنى 0.1 كجم" },
                      })}
                      className="w-full rounded-lg border border-primary/15 bg-white py-2.5 pr-9 pl-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {errors.weight && (
                    <p className="mt-1 text-xs text-red-500">{errors.weight.message}</p>
                  )}
                </div>

                {/* Number of Pieces */}
                <div>
                  <label htmlFor="numberOfPieces" className="mb-1.5 block text-xs font-semibold text-textSecondary">
                    عدد القطع
                  </label>
                  <input
                    id="numberOfPieces"
                    type="number"
                    min="1"
                    {...register("numberOfPieces", { min: 1 })}
                    className="w-full rounded-lg border border-primary/15 bg-white px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Length */}
                <div>
                  <label htmlFor="length" className="mb-1.5 block text-xs font-semibold text-textSecondary">
                    الطول (سم)
                  </label>
                  <div className="relative">
                    <Ruler size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary" />
                    <input
                      id="length"
                      type="number"
                      min="0"
                      {...register("length")}
                      className="w-full rounded-lg border border-primary/15 bg-white py-2.5 pr-9 pl-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Width */}
                <div>
                  <label htmlFor="width" className="mb-1.5 block text-xs font-semibold text-textSecondary">
                    العرض (سم)
                  </label>
                  <input
                    id="width"
                    type="number"
                    min="0"
                    {...register("width")}
                    className="w-full rounded-lg border border-primary/15 bg-white px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Height */}
                <div>
                  <label htmlFor="height" className="mb-1.5 block text-xs font-semibold text-textSecondary">
                    الارتفاع (سم)
                  </label>
                  <input
                    id="height"
                    type="number"
                    min="0"
                    {...register("height")}
                    className="w-full rounded-lg border border-primary/15 bg-white px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Chargeable Weight Indicator */}
              {length > 0 && width > 0 && height > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface/60 px-4 py-2.5 text-xs text-textSecondary border border-primary/10">
                  <span className="flex items-center gap-1.5">
                    <Info size={13} className="text-primary" />
                    الوزن الحجمي: <strong className="text-text font-mono">{volumetricWeight.toFixed(2)} كجم</strong>
                  </span>
                  <span>
                    الوزن المحتسب للرسوم (Chargeable):{" "}
                    <strong className="text-primary font-bold font-mono text-sm">
                      {chargeableWeight.toFixed(2)} كجم
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Calculator size={16} />
                )}
                {isPending ? "جارٍ الحساب..." : "احسب تكلفة الشحن"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-sm font-semibold text-textSecondary transition hover:bg-surface/50 active:scale-95"
              >
                إعادة تعيين
              </button>
            </div>
          </form>
        </div>

        {/* Result Section */}
        <div className="lg:col-span-2">
          {quoteResult ? (
            <div className="space-y-4">
              {/* Price Card */}
              <div className="overflow-hidden rounded-xl border border-primary/10 bg-white shadow-sm">
                <div className="bg-primary/5 px-5 py-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-text">
                    <Banknote size={16} className="text-primary" />
                    نتيجة حساب الشحن
                  </h3>
                </div>
                <div className="p-5">
                  {/* Price */}
                  <div className="mb-5 text-center">
                    <p className="text-xs text-textSecondary">التكلفة الإجمالية</p>
                    <p className="mt-1 text-3xl font-bold text-primary">
                      {quoteResult.price}
                      <span className="mr-1 text-base font-semibold text-textSecondary">
                        {quoteResult.currency}
                      </span>
                    </p>
                    {quoteResult.isEstimated && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        <Info size={12} />
                        سعر تقديري
                      </span>
                    )}
                    {quoteResult.isLiveQuote && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <BadgeCheck size={12} />
                        سعر مباشر من أرامكس
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-3 border-t border-primary/10 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textSecondary">الناقل</span>
                      <span className="font-semibold text-text">{quoteResult.carrierName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textSecondary">الخدمة</span>
                      <span className="font-semibold text-text">{quoteResult.serviceName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-textSecondary">
                        <Clock size={13} />
                        مدة التوصيل
                      </span>
                      <span className="font-semibold text-text">{quoteResult.estimatedDays}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textSecondary">نوع الشحنة</span>
                      <span className="font-semibold text-text">
                        {quoteResult.shipmentType === "document" ? "مستندات (Document)" : "طرد (Parcel)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textSecondary">الوزن الفعلي</span>
                      <span className="font-semibold text-text">{quoteResult.weight} كجم</span>
                    </div>
                    {quoteResult.chargeableWeight && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-textSecondary">الوزن المحتسب للرسوم</span>
                        <span className="font-semibold text-primary">{quoteResult.chargeableWeight} كجم</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textSecondary">من</span>
                      <span className="font-semibold text-text">
                        {quoteResult.origin?.city} ({quoteResult.origin?.countryCode})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textSecondary">إلى</span>
                      <span className="font-semibold text-text">
                        {quoteResult.destination?.city || "—"} ({quoteResult.destination?.countryCode})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textSecondary">نوع الخدمة</span>
                      <span className="rounded bg-surface px-2 py-0.5 font-mono text-xs font-bold text-primary">
                        {quoteResult.productGroup} / {quoteResult.productType}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-primary/15 bg-white/50 p-8 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-primary/40">
                <ArrowLeft size={24} />
              </div>
              <p className="text-sm font-semibold text-textSecondary">
                أدخل بيانات الشحن واضغط على "احسب تكلفة الشحن"
              </p>
              <p className="mt-1 text-xs text-textSecondary/70">
                ستظهر النتيجة هنا مع تفاصيل السعر ومدة التوصيل
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Shipping;
