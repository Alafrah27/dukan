import { useState, useMemo, useCallback } from "react";
import {
  Scissors,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Check,
  TrendingUp,
  Tag,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import {
  useGetTailoringPrices,
  useCreateTailoringPrice,
  useUpdateTailoringPrice,
  useDeleteTailoringPrice,
  useToggleTailoringPriceStatus,
  useBulkUpsertTailoringPrices,
} from "../../services/tailoringQuery";
import { useGetProducts } from "../../services/productQuery";
import Overly from "../../components/Overly";
import ActionMenu from "../../components/ActionMenu";
import DataTable from "../../components/DataTable";
import showToast from "../../lib/toast";
import { currencyFormate } from "../../lib/currencyformate";

// Standard size types definition with Arabic translation and visual badges
const SIZE_TYPES = [
  { key: "child", label: "طفل (Child)", shortLabel: "طفل", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "adult", label: "بالغ (Adult)", shortLabel: "بالغ", color: "bg-teal-50 text-teal-700 border-teal-200" },
];

const getSizeConfig = (sizeKey) => {
  return (
    SIZE_TYPES.find((s) => s.key === sizeKey) || {
      key: sizeKey,
      label: sizeKey,
      shortLabel: sizeKey,
      color: "bg-gray-50 text-gray-700 border-gray-200",
    }
  );
};

/* ─── Tailoring Price Form (Create / Edit Multiple Sizes) ─── */
const TailoringPriceForm = ({ initialData, products = [], onSubmit, isLoading }) => {
  const isEditing = Boolean(initialData);

  const [productId, setProductId] = useState(
    initialData?.productId?._id || (initialData?.productId ? String(initialData.productId) : "global")
  );

  // Initialize sizes list
  const [sizes, setSizes] = useState(() => {
    if (Array.isArray(initialData?.sizeType) && initialData.sizeType.length > 0) {
      return initialData.sizeType.map((s) => ({
        type: s.type || s.sizeType || "child",
        price: s.price !== undefined ? String(s.price) : "",
      }));
    }
    if (typeof initialData?.sizeType === "string") {
      return [
        {
          type: initialData.sizeType,
          price: initialData.price !== undefined ? String(initialData.price) : "",
        },
      ];
    }
    // Initial row with empty price so the admin enters their desired price
    return [{ type: "child", price: "" }];
  });

  const [isActive, setIsActive] = useState(
    initialData?.isActive !== undefined ? initialData.isActive : true
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  const handleSizeChange = (index, field, value) => {
    setSizes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddSize = (presetType = "adult") => {
    setSizes((prev) => [...prev, { type: presetType, price: "" }]);
  };

  const handleRemoveSize = (index) => {
    setSizes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (presetName) => {
    if (presetName === "child_adult") {
      setSizes([
        { type: "child", price: "" },
        { type: "adult", price: "" },
      ]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validSizes = sizes
      .map((s) => ({
        type: s.type.trim(),
        price: Number(s.price),
      }))
      .filter((s) => Boolean(s.type) && !isNaN(s.price) && s.price >= 0);

    if (validSizes.length === 0) {
      showToast.error("يرجى إدخال سعر صحيح لمقاس واحد على الأقل");
      return;
    }

    const payload = {
      productId: productId === "global" ? null : productId,
      sizeType: validSizes,
      isActive,
      notes: notes.trim(),
    };

    if (isEditing) {
      payload.id = initialData._id;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-cairo">
      {/* Product Select */}
      <div>
        <label className="mb-1.5 block text-xs font-bold text-text">
          المنتج المرتبط بالسعر
        </label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full rounded-xl border border-primary/20 bg-background/50 px-3.5 py-2.5 text-xs font-medium text-text outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
        >
          <option value="global">🌐 سعر عام افتراضي (لجميع المنتجات)</option>
          <optgroup label="منتجات المتجر">
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} {p.basePrice ? `(${p.basePrice} ر.س)` : ""}
              </option>
            ))}
          </optgroup>
        </select>
        <span className="mt-1 block text-[11px] text-textSecondary">
          اختر منتجاً بعينه لتحديد سعر تفصيل مخصص له، أو اختر السعر العام كقيمة افتراضية.
        </span>
      </div>

      {/* Sizes and Prices List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-text">
            المقاسات والأسعار <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPreset("child_adult")}
              className="text-[11px] font-bold text-primary hover:underline px-2 py-0.5 rounded bg-primary/10"
            >
              طفل + بالغ
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
          {sizes.map((row, index) => {
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white p-2.5 shadow-xs"
              >
                {/* Size Type Selector */}
                <div className="flex-1">
                  <select
                    value={row.type}
                    onChange={(e) => handleSizeChange(index, "type", e.target.value)}
                    className="w-full rounded-lg border border-primary/20 bg-background/40 px-2.5 py-1.5 text-xs font-bold text-text outline-none focus:border-primary"
                  >
                    <option value="child">👶 طفل (Child)</option>
                    <option value="adult">🧑 بالغ (Adult)</option>
                  </select>
                </div>

                {/* Price Input */}
                <div className="relative w-32">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={row.price}
                    onChange={(e) => handleSizeChange(index, "price", e.target.value)}
                    placeholder="السعر"
                    className="w-full rounded-lg border border-primary/20 bg-background/40 py-1.5 pr-2.5 pl-8 text-xs font-bold text-text outline-none focus:border-primary"
                  />
                  <span className="absolute top-1/2 left-2 -translate-y-1/2 text-[10px] font-bold text-textSecondary">
                    ر.س
                  </span>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveSize(index)}
                  disabled={sizes.length <= 1}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 cursor-pointer"
                  title="حذف هذا المقاس"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleAddSize()}
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition cursor-pointer"
        >
          <Plus size={14} /> إضافة مقاس آخر
        </button>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-primary/15 bg-surface/30 p-3">
        <div>
          <span className="block text-xs font-bold text-text">تفعيل هذا السعر</span>
          <span className="block text-[11px] text-textSecondary">
            عند التفعيل سيتاح هذا السعر للعملاء عند طلب خيار التفصيل
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsActive((prev) => !prev)}
          className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
            isActive ? "bg-primary" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
              isActive ? "translate-x-0.5" : "translate-x-5"
            }`}
          />
        </button>
      </div>

      {/* Notes / Description */}
      <div>
        <label className="mb-1.5 block text-xs font-bold text-text">
          ملاحظات وتفاصيل إضافية (اختياري)
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="مثال: يشمل التطريز اليدوي البسيط، أو تكلفة تفصيل الجلابية للأطفال..."
          className="w-full rounded-xl border border-primary/20 bg-background/50 p-3 text-xs font-medium text-text outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary/10">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary/90 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isLoading && <RefreshCw size={14} className="animate-spin" />}
          <span>{isEditing ? "حفظ التعديلات" : "إضافة السعر"}</span>
        </button>
      </div>
    </form>
  );
};

/* ─── Bulk Product Pricing Matrix Modal ─── */
const BulkPricingModal = ({ products = [], existingPrices = [], onSubmit, isLoading }) => {
  const [selectedProductId, setSelectedProductId] = useState(
    products[0]?._id || "global"
  );

  // Tailoring size types: child and adult only
  const targetSizes = ["child", "adult"];

  const getPriceForProductAndSize = (prodId, size) => {
    const matchDoc = existingPrices.find((p) =>
      prodId === "global"
        ? !p.productId
        : (p.productId?._id || p.productId) === prodId
    );
    if (!matchDoc) return "";
    if (Array.isArray(matchDoc.sizeType)) {
      const item = matchDoc.sizeType.find(
        (s) => (s.type || s.sizeType) === size
      );
      return item?.price !== undefined ? String(item.price) : "";
    }
    if (matchDoc.sizeType === size) {
      return matchDoc.price !== undefined ? String(matchDoc.price) : "";
    }
    return "";
  };

  // Initialize prices map from existing prices for this product if any
  const [matrix, setMatrix] = useState(() => {
    const initial = {};
    targetSizes.forEach((size) => {
      initial[size] = {
        price: getPriceForProductAndSize(selectedProductId, size),
        isActive: true,
      };
    });
    return initial;
  });

  const handleProductChange = (newProductId) => {
    setSelectedProductId(newProductId);
    const updated = {};
    targetSizes.forEach((size) => {
      updated[size] = {
        price: getPriceForProductAndSize(newProductId, size),
        isActive: true,
      };
    });
    setMatrix(updated);
  };

  const handlePriceChange = (size, val) => {
    setMatrix((prev) => ({
      ...prev,
      [size]: { ...prev[size], price: val },
    }));
  };

  const handleToggle = (size) => {
    setMatrix((prev) => ({
      ...prev,
      [size]: { ...prev[size], isActive: !prev[size].isActive },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const pricesToSubmit = [];
    for (const size of targetSizes) {
      const item = matrix[size];
      if (item && item.price !== "" && !isNaN(Number(item.price))) {
        pricesToSubmit.push({
          type: size,
          sizeType: size,
          price: Number(item.price),
          isActive: Boolean(item.isActive),
        });
      }
    }

    if (pricesToSubmit.length === 0) {
      showToast.error("يرجى إدخال سعر واحد على الأقل للمقاسات");
      return;
    }

    onSubmit({
      productId: selectedProductId === "global" ? null : selectedProductId,
      prices: pricesToSubmit,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-cairo">
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3.5 text-xs text-textSecondary">
        <p className="flex items-center gap-1.5 font-bold text-primary">
          <Sparkles size={16} /> ضبط مصفوفة الأسعار السريعة
        </p>
        <p className="mt-1 text-[11px] leading-relaxed">
          يمكنك إدخال أو تحديث أسعار المقاسات الأساسية (طفل، صغير، متوسط، كبير، بالغ) دفعة واحدة للمنتج المحدد.
        </p>
      </div>

      {/* Product Select */}
      <div>
        <label className="mb-1.5 block text-xs font-bold text-text">
          اختر المنتج لتطبيق المصفوفة عليه
        </label>
        <select
          value={selectedProductId}
          onChange={(e) => handleProductChange(e.target.value)}
          className="w-full rounded-xl border border-primary/20 bg-background/50 px-3.5 py-2.5 text-xs font-medium text-text outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
        >
          <option value="global">🌐 الأسعار العامة الافتراضية</option>
          <optgroup label="المنتجات">
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} {p.basePrice ? `(${p.basePrice} ر.س)` : ""}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Grid of sizes */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-text">
          أسعار المقاسات (بالريال السعودي)
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {targetSizes.map((sizeKey) => {
            const config = getSizeConfig(sizeKey);
            const item = matrix[sizeKey] || { price: "", isActive: true };

            return (
              <div
                key={sizeKey}
                className="flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-white p-3 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-xs font-bold ${config.color}`}
                  >
                    {config.shortLabel}
                  </span>
                  <span className="text-[11px] text-textSecondary font-mono">
                    {sizeKey}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-24">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      value={item.price}
                      onChange={(e) => handlePriceChange(sizeKey, e.target.value)}
                      className="w-full rounded-lg border border-primary/20 py-1.5 pr-2.5 pl-8 text-xs font-bold text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <span className="absolute top-1/2 left-2 -translate-y-1/2 text-[10px] font-bold text-textSecondary">
                      ر.س
                    </span>
                  </div>

                  <button
                    type="button"
                    title={item.isActive ? "مفعل" : "غير مفعل"}
                    onClick={() => handleToggle(sizeKey)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer ${
                      item.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                        : "border-gray-200 bg-gray-50 text-gray-400"
                    }`}
                  >
                    {item.isActive ? <Check size={16} /> : <X size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary/10">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary/90 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isLoading && <RefreshCw size={14} className="animate-spin" />}
          <span>حفظ جميع الأسعار</span>
        </button>
      </div>
    </form>
  );
};

/* ─── Delete Confirmation Modal ─── */
const DeleteConfirm = ({ item, onConfirm, onCancel, isLoading }) => {
  const sizeConfig = getSizeConfig(item?.sizeType);
  const productName = item?.productId?.name || "السعر العام الافتراضي";

  return (
    <div className="space-y-4 font-cairo">
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <Trash2 size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-900">
            تأكيد حذف سعر التفصيل
          </h4>
          <p className="mt-0.5 text-xs text-rose-700">
            هل أنت متأكد من رغبتك في حذف سعر مقاس{" "}
            <strong>{sizeConfig.label}</strong> لـ{" "}
            <strong>{productName}</strong>؟ لن تتمكن من التراجع عن هذه الخطوة.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-xs font-semibold text-text transition hover:bg-surface cursor-pointer"
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isLoading && <RefreshCw size={14} className="animate-spin" />}
          <span>نعم، حذف السعر</span>
        </button>
      </div>
    </div>
  );
};

/* ─── Main Tailoring Dashboard Page ─── */
function Tailoring() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState("all");
  const [selectedSizeFilter, setSelectedSizeFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  const [overlay, setOverlay] = useState({ type: null, data: null });

  // Queries
  const {
    data: tailoringData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetTailoringPrices({
    page,
    limit,
    productId: selectedProductFilter === "all" ? undefined : selectedProductFilter,
    sizeType: selectedSizeFilter === "all" ? undefined : selectedSizeFilter,
    isActive:
      selectedStatusFilter === "all"
        ? undefined
        : selectedStatusFilter === "active",
    search: search.trim() || undefined,
  });

  // Fetch products for dropdown selector and filtering
  const { data: productsData } = useGetProducts({ limit: 100 });
  const products = productsData?.products || [];

  // Mutations
  const createMutation = useCreateTailoringPrice();
  const updateMutation = useUpdateTailoringPrice();
  const deleteMutation = useDeleteTailoringPrice();
  const toggleMutation = useToggleTailoringPriceStatus();
  const bulkMutation = useBulkUpsertTailoringPrices();

  const tailoringPrices = tailoringData?.tailoringPrices || [];
  const pagination = tailoringData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 20,
  };

  // Handlers
  const openCreate = () => setOverlay({ type: "form", data: null });
  const openBulk = () => setOverlay({ type: "bulk", data: null });
  const openEdit = useCallback((item) => setOverlay({ type: "form", data: item }), []);
  const openDelete = useCallback((item) => setOverlay({ type: "delete", data: item }), []);
  const closeOverlay = () => setOverlay({ type: null, data: null });

  const handleToggleStatus = async (item) => {
    try {
      await toggleMutation.mutateAsync(item._id);
      showToast.success(
        item.isActive ? "تم تعطيل سعر التفصيل" : "تم تفعيل سعر التفصيل"
      );
    } catch (err) {
      showToast.error(
        err.response?.data?.error || err.message || "فشل تغيير حالة السعر"
      );
    }
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (payload.id) {
        await updateMutation.mutateAsync(payload);
        showToast.success("تم تحديث سعر التفصيل بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        showToast.success("تمت إضافة سعر التفصيل بنجاح");
      }
      closeOverlay();
    } catch (err) {
      showToast.error(
        err.response?.data?.error || err.message || "حدث خطأ أثناء حفظ السعر"
      );
    }
  };

  const handleBulkSubmit = async (payload) => {
    try {
      await bulkMutation.mutateAsync(payload);
      showToast.success("تم حفظ مصفوفة أسعار التفصيل بنجاح");
      closeOverlay();
    } catch (err) {
      showToast.error(
        err.response?.data?.error || err.message || "فشل حفظ مصفوفة الأسعار"
      );
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(overlay.data._id);
      showToast.success("تم حذف سعر التفصيل بنجاح");
      closeOverlay();
    } catch (err) {
      showToast.error(
        err.response?.data?.error || err.message || "فشل حذف سعر التفصيل"
      );
    }
  };

  // Formatting date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Intl.DateTimeFormat("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = pagination.totalItems || tailoringPrices.length;
    const active = tailoringPrices.filter((p) => p.isActive).length;
    const inactive = tailoringPrices.length - active;
    let totalPriceSum = 0;
    let totalCount = 0;
    tailoringPrices.forEach((p) => {
      if (Array.isArray(p.sizeType) && p.sizeType.length > 0) {
        p.sizeType.forEach((s) => {
          totalPriceSum += Number(s.price) || 0;
          totalCount += 1;
        });
      } else if (p.price !== undefined) {
        totalPriceSum += Number(p.price) || 0;
        totalCount += 1;
      }
    });
    const avgPrice = totalCount > 0 ? totalPriceSum / totalCount : 0;

    return { total, active, inactive, avgPrice };
  }, [tailoringPrices, pagination.totalItems]);

  // Columns definition for DataTable
  const columns = useMemo(
    () => [
      {
        key: "product",
        label: "المنتج",
        render: (item) => {
          const product = item.productId;
          if (!product) {
            return (
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <Scissors size={18} />
                </div>
                <div>
                  <span className="block text-xs font-bold text-primary">
                    🌐 سعر عام افتراضي
                  </span>
                  <span className="block text-[11px] text-textSecondary">
                    يطبق على أي منتج لا يملك تسعيراً خاصاً
                  </span>
                </div>
              </div>
            );
          }

          const image = product.images?.[0];
          return (
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-primary/15 bg-surface/50">
                {image ? (
                  <img
                    src={image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-primary/40">
                    <Package size={18} />
                  </div>
                )}
              </div>
              <div>
                <span className="block text-xs font-bold text-text">
                  {product.name}
                </span>
                <span className="block text-[11px] text-textSecondary font-mono" dir="ltr">
                  {product.basePrice ? `الأساس: ${product.basePrice} ر.س` : ""}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "sizeType",
        label: "المقاسات وأسعار التفصيل",
        className: "min-w-[240px]",
        headerClassName: "min-w-[240px]",
        render: (item) => {
          const list =
            Array.isArray(item.sizeType) && item.sizeType.length > 0
              ? item.sizeType
              : typeof item.sizeType === "string"
              ? [{ type: item.sizeType, price: item.price }]
              : item.price !== undefined
              ? [{ type: "custom", price: item.price }]
              : [];

          if (list.length === 0) {
            return (
              <span className="text-xs italic text-textSecondary">
                لا توجد مقاسات محددة
              </span>
            );
          }

          return (
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              {list.map((s, idx) => {
                const sType = s.type || s.sizeType || "custom";
                const config = getSizeConfig(sType);
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${config.color}`}
                  >
                    <Tag size={11} className="opacity-70" />
                    <span>{config.shortLabel || config.label}</span>
                    <span className="opacity-30">|</span>
                    <span className="font-extrabold text-emerald-700">
                      {currencyFormate(s.price || 0)}
                    </span>
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        key: "isActive",
        label: "الحالة",
        className: "w-28 text-center",
        headerClassName: "w-28 text-center",
        render: (item) => (
          <button
            type="button"
            onClick={() => handleToggleStatus(item)}
            disabled={toggleMutation.isPending}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
              item.isActive
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title="انقر لتبديل الحالة"
          >
            {item.isActive ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>مفعل</span>
              </>
            ) : (
              <>
                <XCircle size={13} className="text-gray-400" />
                <span>معطل</span>
              </>
            )}
          </button>
        ),
      },
      {
        key: "notes",
        label: "ملاحظات",
        className: "hidden md:table-cell text-textSecondary text-xs max-w-xs truncate",
        headerClassName: "hidden md:table-cell",
        render: (item) => item.notes || "—",
      },
      {
        key: "updatedAt",
        label: "تاريخ التحديث",
        className: "hidden lg:table-cell text-textSecondary text-xs",
        headerClassName: "hidden lg:table-cell",
        render: (item) => formatDate(item.updatedAt || item.createdAt),
      },
      {
        key: "actions",
        label: "الإجراءات",
        className: "text-center w-24",
        headerClassName: "text-center w-24",
        render: (item) => {
          const menuActions = [
            {
              label: "تعديل السعر",
              icon: Pencil,
              onClick: () => openEdit(item),
            },
            {
              label: item.isActive ? "تعطيل السعر" : "تفعيل السعر",
              icon: item.isActive ? XCircle : CheckCircle2,
              onClick: () => handleToggleStatus(item),
            },
            {
              label: "حذف السعر",
              icon: Trash2,
              danger: true,
              onClick: () => openDelete(item),
            },
          ];
          return <ActionMenu actions={menuActions} />;
        },
      },
    ],
    [openEdit, openDelete, toggleMutation.isPending]
  );

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Scissors size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                إدارة أسعار التفصيل
              </h1>
              <p className="mt-0.5 text-xs text-textSecondary sm:text-sm">
                ضبط وتحديث تكاليف التفصيل حسب مقاسات العملاء والمنتجات
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-3.5 py-2.5 text-xs font-semibold text-text transition hover:bg-surface active:scale-95 cursor-pointer disabled:opacity-60"
            title="تحديث البيانات"
          >
            <RefreshCw
              size={15}
              className={isFetching ? "animate-spin text-primary" : ""}
            />
            <span className="hidden sm:inline">
              {isFetching ? "جارٍ التحديث..." : "تحديث"}
            </span>
          </button>

          <button
            type="button"
            onClick={openBulk}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/20 active:scale-95 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>مصفوفة أسعار منتج</span>
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary/90 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>إضافة سعر جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-primary/10 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-textSecondary">
            <span className="text-xs font-semibold">إجمالي القواعد</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers size={16} />
            </div>
          </div>
          <span className="mt-2 block text-2xl font-bold text-text">
            {stats.total}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-textSecondary">
            <span className="text-xs font-semibold">الأسعار المفعلة</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <span className="mt-2 block text-2xl font-bold text-emerald-700">
            {stats.active}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-textSecondary">
            <span className="text-xs font-semibold">الأسعار المعطلة</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
              <XCircle size={16} />
            </div>
          </div>
          <span className="mt-2 block text-2xl font-bold text-gray-700">
            {stats.inactive}
          </span>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-textSecondary">
            <span className="text-xs font-semibold">متوسط تكلفة التفصيل</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <span className="mt-2 block text-xl font-bold text-text">
            {currencyFormate(Math.round(stats.avgPrice))}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 text-textSecondary pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="بحث في الملاحظات أو المقاس..."
              className="w-full rounded-xl border border-primary/15 bg-background/50 py-2 pr-9 pl-8 text-xs font-medium text-text placeholder-textSecondary/70 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-textSecondary hover:text-primary transition cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Product Filter */}
          <div>
            <select
              value={selectedProductFilter}
              onChange={(e) => {
                setSelectedProductFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-primary/15 bg-background/50 px-3 py-2 text-xs font-medium text-text outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">جميع المنتجات</option>
              <option value="global">🌐 الأسعار العامة فقط</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Size Filter */}
          <div>
            <select
              value={selectedSizeFilter}
              onChange={(e) => {
                setSelectedSizeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-primary/15 bg-background/50 px-3 py-2 text-xs font-medium text-text outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">جميع أنواع المقاسات</option>
              {SIZE_TYPES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-primary/15 bg-background/50 px-3 py-2 text-xs font-medium text-text outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">مفعل فقط</option>
              <option value="inactive">معطل فقط</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={tailoringPrices}
        rowKey="_id"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        pagination={{
          totalItems: pagination.totalItems,
          totalPages: pagination.totalPages,
          currentPage: page,
          hasNext: page < pagination.totalPages,
          hasPrev: page > 1,
        }}
        onPageChange={setPage}
        emptyIcon={Scissors}
        emptyTitle={
          search || selectedProductFilter !== "all" || selectedSizeFilter !== "all"
            ? "لم يتم العثور على نتائج"
            : "لا توجد أسعار تفصيل بعد"
        }
        emptyDescription={
          search || selectedProductFilter !== "all" || selectedSizeFilter !== "all"
            ? "جرب تغيير معايير البحث أو الفلترة"
            : "ابدأ بإضافة أول سعر تفصيل لربطه بمنتجات المتجر أو كقيمة عامة"
        }
        skeletonRows={5}
        skeletonColumns={6}
        itemLabel="سعر تفصيل"
      />

      {/* Create / Edit Modal */}
      <Overly
        isOpen={overlay.type === "form"}
        onClose={closeOverlay}
        title={overlay.data ? "تعديل سعر التفصيل" : "إضافة سعر تفصيل جديد"}
        maxWidth="max-w-lg"
      >
        <TailoringPriceForm
          key={overlay.data?._id || "create"}
          initialData={overlay.data}
          products={products}
          onSubmit={handleFormSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Overly>

      {/* Bulk Matrix Modal */}
      <Overly
        isOpen={overlay.type === "bulk"}
        onClose={closeOverlay}
        title="مصفوفة أسعار التفصيل لمنتج"
        maxWidth="max-w-2xl"
      >
        <BulkPricingModal
          products={products}
          existingPrices={tailoringPrices}
          onSubmit={handleBulkSubmit}
          isLoading={bulkMutation.isPending}
        />
      </Overly>

      {/* Delete Confirmation Modal */}
      <Overly
        isOpen={overlay.type === "delete"}
        onClose={closeOverlay}
        title="حذف سعر التفصيل"
        maxWidth="max-w-sm"
      >
        <DeleteConfirm
          item={overlay.data}
          onConfirm={handleDeleteConfirm}
          onCancel={closeOverlay}
          isLoading={deleteMutation.isPending}
        />
      </Overly>
    </div>
  );
}

export default Tailoring;
