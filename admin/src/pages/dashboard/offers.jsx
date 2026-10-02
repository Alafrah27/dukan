import { useState, useMemo, useCallback } from "react";
import {
  Tag,
  Percent,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import {
  useGetOffers,
  useCreateOffer,
  useUpdateOffer,
  useToggleOfferStatus,
  useDeleteOffer,
} from "../../services/offerQuery";
import { useGetProducts } from "../../services/productQuery";
import Overly from "../../components/Overly";
import ActionMenu from "../../components/ActionMenu";
import DataTable from "../../components/DataTable";
import showToast from "../../lib/toast";
import { currencyFormate } from "../../lib/currencyformate";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const toDateTimeLocalInput = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

const calculateDiscountedPrice = (basePrice, value, type) => {
  if (!basePrice || basePrice <= 0 || !value || value <= 0) return basePrice || 0;
  if (type === "percent") {
    const discount = (basePrice * Number(value)) / 100;
    return Math.max(0, basePrice - discount);
  }
  return Math.max(0, basePrice - Number(value));
};

const getOfferStatus = (offer) => {
  if (!offer.isActive) {
    return {
      label: "معطل",
      badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
      dotClass: "bg-slate-400",
    };
  }
  const now = new Date();
  const start = new Date(offer.startDate);
  const end = new Date(offer.endDate);

  if (now < start) {
    return {
      label: "قادم قريباً",
      badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
      dotClass: "bg-blue-500",
    };
  }
  if (now > end) {
    return {
      label: "منتهي",
      badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
      dotClass: "bg-rose-500",
    };
  }
  return {
    label: "نشط حالياً",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dotClass: "bg-emerald-500 animate-pulse",
  };
};

/* ─────────────────────────────────────────────
   Offer Form Component (Inside Overly)
───────────────────────────────────────────── */
const OfferForm = ({ initialData, products = [], onSubmit, isLoading }) => {
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || "");
  const [productId, setProductId] = useState(
    initialData?.productId?._id || initialData?.productId || ""
  );
  const [value, setValue] = useState(initialData?.value ?? "");
  const [type, setType] = useState(initialData?.type || "percent");
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? toDateTimeLocalInput(initialData.startDate)
      : toDateTimeLocalInput(new Date())
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate
      ? toDateTimeLocalInput(initialData.endDate)
      : toDateTimeLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [productSearch, setProductSearch] = useState("");

  // Selected product object
  const selectedProduct = useMemo(() => {
    return products.find((p) => p._id === productId);
  }, [products, productId]);

  // Filtered products for dropdown
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name?.toLowerCase().includes(q));
  }, [products, productSearch]);

  // Calculated preview price
  const previewDiscountedPrice = useMemo(() => {
    if (!selectedProduct?.basePrice || !value) return null;
    return calculateDiscountedPrice(selectedProduct.basePrice, value, type);
  }, [selectedProduct, value, type]);

  // Apply Quick Date Range Presets
  const applyPresetDays = (days) => {
    const start = new Date();
    const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setStartDate(toDateTimeLocalInput(start));
    setEndDate(toDateTimeLocalInput(end));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!productId) {
      showToast.error("يرجى اختيار المنتج المراد تطبيق العرض عليه");
      return;
    }
    if (!value || Number(value) <= 0) {
      showToast.error("يرجى إدخال قيمة خصم صحيحة");
      return;
    }
    if (type === "percent" && Number(value) > 100) {
      showToast.error("نسبة الخصم المئوية لا يمكن أن تتجاوز 100%");
      return;
    }
    if (
      type === "fixed" &&
      selectedProduct?.basePrice &&
      Number(value) >= selectedProduct.basePrice
    ) {
      showToast.error("قيمة الخصم الثابت يجب أن تكون أقل من سعر المنتج الأصلي");
      return;
    }
    if (!startDate) {
      showToast.error("يرجى تحديد تاريخ بداية العرض");
      return;
    }
    if (!endDate) {
      showToast.error("يرجى تحديد تاريخ نهاية العرض");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      showToast.error("تاريخ نهاية العرض يجب أن يكون بعد تاريخ البداية");
      return;
    }

    const payload = {
      title: title.trim(),
      productId,
      productsId: [productId],
      value: Number(value),
      type,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      isActive,
    };

    if (isEditing) {
      payload.offerId = initialData._id;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-cairo text-right" dir="rtl">
      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-text mb-1.5">
          عنوان أو مسمى العرض (اختياري)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: خصم الصيف الحصري، عرض نهاية الأسبوع..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-primary/15 bg-white text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Product Selection */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-text">
            المنتج المراد تطبيق الخصم عليه <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-textSecondary">
            {filteredProducts.length} منتج متاح
          </span>
        </div>

        {/* Search inside product dropdown if more than 5 products */}
        {products.length > 5 && (
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary"
            />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="w-full pr-8 pl-3 py-1.5 text-xs rounded-lg border border-primary/15 bg-surface/30 focus:outline-none focus:border-primary"
            />
          </div>
        )}

        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-primary/15 bg-white text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
        >
          <option value="">-- اختر منتجاً من القائمة --</option>
          {filteredProducts.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} — ({currencyFormate(p.basePrice || 0)})
            </option>
          ))}
        </select>

        {/* Selected Product Preview Card */}
        {selectedProduct && (
          <div className="mt-2.5 flex items-center gap-3 p-2.5 rounded-xl bg-surface/50 border border-primary/10">
            <div className="h-11 w-11 rounded-lg overflow-hidden bg-white shrink-0 border border-primary/10">
              {selectedProduct.images?.[0] ? (
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-primary/40">
                  <Package size={18} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-text truncate block">
                {selectedProduct.name}
              </span>
              <span className="text-[11px] text-textSecondary font-semibold">
                السعر الأساسي: {currencyFormate(selectedProduct.basePrice || 0)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Discount Type & Value */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Type */}
        <div>
          <label className="block text-xs font-bold text-text mb-1.5">
            نوع الخصم <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("percent")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                type === "percent"
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface/30 text-textSecondary border-primary/15 hover:border-primary/40"
              }`}
            >
              <Percent size={14} />
              <span>نسبة مئوية (%)</span>
            </button>
            <button
              type="button"
              onClick={() => setType("fixed")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                type === "fixed"
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-surface/30 text-textSecondary border-primary/15 hover:border-primary/40"
              }`}
            >
              <Tag size={14} />
              <span>مبلغ ثابت (ر.س)</span>
            </button>
          </div>
        </div>

        {/* Value */}
        <div>
          <label className="block text-xs font-bold text-text mb-1.5">
            قيمة الخصم <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0.01"
              step={type === "percent" ? "1" : "0.5"}
              max={type === "percent" ? "100" : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "percent" ? "مثال: 20" : "مثال: 50"}
              className="w-full px-3.5 py-2.5 rounded-xl border border-primary/15 bg-white text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-textSecondary pointer-events-none">
              {type === "percent" ? "%" : "ر.س"}
            </span>
          </div>
        </div>
      </div>

      {/* Live Calculation Preview */}
      {selectedProduct && previewDiscountedPrice !== null && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800">
            <Sparkles size={18} className="text-emerald-600 shrink-0" />
            <div>
              <span className="text-[11px] font-bold block">معاينة السعر بعد الخصم:</span>
              <span className="text-xs text-emerald-700">
                توفير{" "}
                {currencyFormate(
                  selectedProduct.basePrice - previewDiscountedPrice
                )}
              </span>
            </div>
          </div>
          <div className="text-left">
            <span className="text-[11px] text-textSecondary line-through block">
              {currencyFormate(selectedProduct.basePrice)}
            </span>
            <span className="text-sm font-black text-emerald-700 block">
              {currencyFormate(previewDiscountedPrice)}
            </span>
          </div>
        </div>
      )}

      {/* Date Range & Presets */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-text">
            فترة سريان العرض <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-textSecondary">فترة سريعة:</span>
            <button
              type="button"
              onClick={() => applyPresetDays(3)}
              className="px-2 py-0.5 text-[10px] rounded-md bg-surface text-primary hover:bg-primary/10 transition-colors"
            >
              3 أيام
            </button>
            <button
              type="button"
              onClick={() => applyPresetDays(7)}
              className="px-2 py-0.5 text-[10px] rounded-md bg-surface text-primary hover:bg-primary/10 transition-colors"
            >
              أسبوع
            </button>
            <button
              type="button"
              onClick={() => applyPresetDays(30)}
              className="px-2 py-0.5 text-[10px] rounded-md bg-surface text-primary hover:bg-primary/10 transition-colors"
            >
              شهر
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] text-textSecondary block mb-1">
              تاريخ البداية:
            </span>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-primary/15 bg-white text-text text-xs focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <span className="text-[11px] text-textSecondary block mb-1">
              تاريخ النهاية:
            </span>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-primary/15 bg-white text-text text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Active Toggle Switch */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-surface/30">
        <div>
          <span className="text-xs font-bold text-text block">تفعيل العرض فوراً</span>
          <span className="text-[11px] text-textSecondary block">
            يمكنك إيقاف العرض مؤقتاً في أي وقت
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
            isActive ? "bg-primary" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? "-translate-x-6" : "-translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>جارٍ الحفظ...</span>
          </>
        ) : isEditing ? (
          "تحديث العرض"
        ) : (
          "إضافة العرض"
        )}
      </button>
    </form>
  );
};

/* ─────────────────────────────────────────────
   Delete Confirmation Dialog (Inside Overly)
───────────────────────────────────────────── */
const DeleteConfirm = ({ offer, onConfirm, onCancel, isLoading }) => (
  <div className="text-center space-y-4 font-cairo text-right" dir="rtl">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
      <Trash2 size={28} />
    </div>

    {offer?.productId?.images?.[0] && (
      <img
        src={offer.productId.images[0]}
        alt={offer.productId?.name || "معاينة"}
        className="w-16 h-16 rounded-xl object-cover mx-auto border border-primary/10 shadow-xs"
      />
    )}

    <div>
      <h3 className="text-base font-bold text-text text-center">تأكيد حذف العرض</h3>
      <p className="mt-1 text-xs text-textSecondary text-center">
        هل أنت متأكد من حذف العرض الترويجي على المنتج{" "}
        <strong className="text-text font-bold">
          "{offer?.productId?.name || offer?.title || "العرض"}"
        </strong>
        ؟ لا يمكن التراجع عن هذا الإجراء.
      </p>
    </div>

    <div className="flex gap-2.5 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="flex-1 py-2 rounded-xl border border-primary/15 text-textSecondary text-xs font-semibold hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
      >
        إلغاء
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isLoading}
        className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {isLoading ? "جارٍ الحذف..." : "حذف العرض"}
      </button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main Offers Dashboard Page
───────────────────────────────────────────── */
function Offers() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimer, setSearchTimer] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [overlay, setOverlay] = useState({ type: null, data: null });

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(
      setTimeout(() => {
        setDebouncedSearch(val);
        setPage(1);
      }, 400)
    );
  };

  // Queries
  const { data, isLoading, isError, error, refetch, isFetching } = useGetOffers({
    page,
    limit,
    status: statusFilter,
    type: typeFilter,
    search: debouncedSearch,
  });

  // Fetch products for dropdown selection in form
  const { data: productsData } = useGetProducts({ limit: 100 });
  const products = productsData?.products || [];

  // Mutations
  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer();
  const toggleMutation = useToggleOfferStatus();
  const deleteMutation = useDeleteOffer();

  const offers = data?.offers || [];
  const stats = data?.stats || {
    total: 0,
    active: 0,
    upcoming: 0,
    expired: 0,
  };
  const pagination = data?.pagination || {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    hasNext: false,
    hasPrev: false,
  };

  // Handlers
  const openCreate = () => setOverlay({ type: "form", data: null });
  const openEdit = useCallback((offer) => setOverlay({ type: "form", data: offer }), []);
  const openDelete = useCallback((offer) => setOverlay({ type: "delete", data: offer }), []);
  const closeOverlay = () => setOverlay({ type: null, data: null });

  const handleSubmit = async (payload) => {
    try {
      if (payload.offerId) {
        await updateMutation.mutateAsync(payload);
        showToast.success("تم تحديث العرض بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        showToast.success("تم إنشاء العرض بنجاح");
      }
      closeOverlay();
    } catch (err) {
      showToast.error(
        err.response?.data?.error || err.message || "حدث خطأ غير متوقع"
      );
    }
  };

  const handleToggle = async (offer) => {
    try {
      await toggleMutation.mutateAsync(offer._id);
      showToast.success(
        offer.isActive ? "تم تعطيل العرض بنجاح" : "تم تفعيل العرض بنجاح"
      );
    } catch (err) {
      showToast.error(
        err.response?.data?.error || err.message || "فشل تغيير حالة العرض"
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(overlay.data._id);
      showToast.success("تم حذف العرض بنجاح");
      closeOverlay();
    } catch (err) {
      showToast.error(
        err.response?.data?.error || err.message || "فشل حذف العرض"
      );
    }
  };

  // Table Columns
  const columns = useMemo(
    () => [
      {
        key: "product",
        label: "المنتج والعرض",
        render: (offer) => {
          const product = offer.productId;
          return (
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl overflow-hidden bg-surface/50 border border-primary/10 flex items-center justify-center shrink-0">
                {product?.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-200 hover:scale-110"
                  />
                ) : (
                  <Package size={20} className="text-primary/40" />
                )}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-text text-xs block truncate max-w-[200px]">
                  {product?.name || "منتج غير متوفر"}
                </span>
                {offer.title && (
                  <span className="text-[11px] text-primary font-semibold block truncate max-w-[200px]">
                    {offer.title}
                  </span>
                )}
                <span className="text-[10px] text-textSecondary font-mono block" dir="ltr">
                  ID: {offer._id?.slice(0, 8)}...
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "discount",
        label: "قيمة الخصم",
        render: (offer) => {
          const isPercent = offer.type === "percent";
          return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs">
              {isPercent ? <Percent size={13} /> : <Tag size={13} />}
              <span>
                {isPercent ? `${offer.value}%` : `${offer.value} ر.س`}
              </span>
            </div>
          );
        },
      },
      {
        key: "price",
        label: "السعر بعد الخصم",
        render: (offer) => {
          const basePrice = offer.productId?.basePrice || 0;
          const discounted = calculateDiscountedPrice(
            basePrice,
            offer.value,
            offer.type
          );
          return (
            <div>
              <span className="text-xs font-bold text-emerald-700 block">
                {currencyFormate(discounted)}
              </span>
              {basePrice > 0 && (
                <span className="text-[10px] text-textSecondary line-through block">
                  {currencyFormate(basePrice)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "dates",
        label: "فترة العرض",
        className: "hidden md:table-cell",
        headerClassName: "hidden md:table-cell",
        render: (offer) => (
          <div className="text-[11px] space-y-0.5">
            <div className="flex items-center gap-1 text-textSecondary">
              <span className="font-semibold text-text">من:</span>
              <span>{formatDate(offer.startDate)}</span>
            </div>
            <div className="flex items-center gap-1 text-textSecondary">
              <span className="font-semibold text-text">إلى:</span>
              <span>{formatDate(offer.endDate)}</span>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        label: "الحالة",
        render: (offer) => {
          const status = getOfferStatus(offer);
          return (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${status.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                {status.label}
              </span>
              <button
                type="button"
                onClick={() => handleToggle(offer)}
                disabled={toggleMutation.isPending}
                className="text-textSecondary hover:text-primary p-1 rounded-md transition-colors"
                title={offer.isActive ? "تعطيل العرض" : "تفعيل العرض"}
              >
                {offer.isActive ? (
                  <ToggleRight size={20} className="text-primary" />
                ) : (
                  <ToggleLeft size={20} className="text-slate-400" />
                )}
              </button>
            </div>
          );
        },
      },
      {
        key: "actions",
        label: "الإجراءات",
        className: "text-center w-20",
        headerClassName: "text-center w-20",
        render: (offer) => (
          <ActionMenu
            actions={[
              {
                label: "تعديل العرض",
                icon: Pencil,
                onClick: () => openEdit(offer),
              },
              {
                label: offer.isActive ? "تعطيل العرض" : "تفعيل العرض",
                icon: offer.isActive ? ToggleLeft : ToggleRight,
                onClick: () => handleToggle(offer),
              },
              {
                label: "حذف العرض",
                icon: Trash2,
                danger: true,
                onClick: () => openDelete(offer),
              },
            ]}
          />
        ),
      },
    ],
    [toggleMutation.isPending, openEdit, openDelete]
  );

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">العروض والخصومات</h1>
          <p className="mt-1 text-xs text-textSecondary">
            إدارة الحملات الترويجية ونسب الخصم على المنتجات في المتجر
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-primary/15 bg-white text-textSecondary hover:border-primary hover:text-text transition-all cursor-pointer disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw
              size={14}
              className={isFetching ? "animate-spin text-primary" : ""}
            />
            <span className="hidden sm:inline">تحديث</span>
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>إضافة عرض جديد</span>
          </button>
        </div>
      </div>

      {/* ─── Stats Overview Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Offers */}
        <div className="p-4 rounded-2xl border border-primary/10 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-textSecondary">
              إجمالي العروض
            </span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Tag size={16} />
            </div>
          </div>
          <span className="text-xl font-black text-text">{stats.total}</span>
        </div>

        {/* Active Offers */}
        <div className="p-4 rounded-2xl border border-emerald-100 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-800">
              العروض النشطة
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <span className="text-xl font-black text-emerald-700">
            {stats.active}
          </span>
        </div>

        {/* Upcoming Offers */}
        <div className="p-4 rounded-2xl border border-blue-100 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-800">
              قادمة قريباً
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <span className="text-xl font-black text-blue-700">
            {stats.upcoming}
          </span>
        </div>

        {/* Expired Offers */}
        <div className="p-4 rounded-2xl border border-rose-100 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-800">
              عروض منتهية
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <span className="text-xl font-black text-rose-700">
            {stats.expired}
          </span>
        </div>
      </div>

      {/* ─── Search & Filter Bar ─── */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl border border-primary/10 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-textSecondary"
            />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="ابحث باسم المنتج أو عنوان العرض..."
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-primary/15 bg-surface/30 text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setPage(1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-rose-500 text-xs"
              >
                مسح
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-primary/15 bg-white text-text text-xs focus:outline-none focus:border-primary cursor-pointer shrink-0"
          >
            <option value="all">جميع أنواع الخصم</option>
            <option value="percent">نسبة مئوية (%)</option>
            <option value="fixed">مبلغ ثابت (ر.س)</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-primary/5">
          {[
            { id: "all", label: "الكل" },
            { id: "active", label: "نشط حالياً" },
            { id: "upcoming", label: "قادم قريباً" },
            { id: "expired", label: "منتهي" },
            { id: "inactive", label: "معطل" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface/50 text-textSecondary hover:bg-surface hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── DataTable ─── */}
      <DataTable
        columns={columns}
        data={offers}
        rowKey="_id"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
        emptyIcon={Tag}
        emptyTitle="لا توجد عروض ترويجية"
        emptyDescription="لم يتم العثور على أي عروض مطابقة للشروط المحددة. يمكنك إضافة عرض جديد بالضغط على الزر أعلاه."
        itemLabel="عرض"
        skeletonRows={5}
        skeletonColumns={6}
        skeletonHasAvatar={true}
      />

      {/* ─── Offer Modal (Create / Edit) ─── */}
      <Overly
        isOpen={overlay.type === "form"}
        onClose={closeOverlay}
        title={overlay.data ? "تعديل العرض الترويجي" : "إضافة عرض ترويجي جديد"}
        maxWidth="max-w-lg"
      >
        <OfferForm
          initialData={overlay.data}
          products={products}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Overly>

      {/* ─── Delete Confirmation Modal ─── */}
      <Overly
        isOpen={overlay.type === "delete"}
        onClose={closeOverlay}
        title="حذف العرض"
        maxWidth="max-w-md"
      >
        <DeleteConfirm
          offer={overlay.data}
          onConfirm={handleDelete}
          onCancel={closeOverlay}
          isLoading={deleteMutation.isPending}
        />
      </Overly>
    </div>
  );
}

export default Offers;