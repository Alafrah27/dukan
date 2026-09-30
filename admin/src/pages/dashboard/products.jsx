import { useState, useMemo, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  Search,
  Package,
  RefreshCw,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  useGetProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "../../services/productQuery";
import { useGetCategories } from "../../services/categoryQuery";
import Overly from "../../components/Overly";
import ActionMenu from "../../components/ActionMenu";
import DataTable from "../../components/DataTable";
import showToast from "../../lib/toast";
import { currencyFormate } from "../../lib/currencyformate";

/* ─────────────────────────────────────────────
   Tag Input  (sizes / colors)
───────────────────────────────────────────── */
const TagInput = ({ tags = [], onChange, placeholder }) => {
  const [input, setInput] = useState("");

  const addTag = () => {
    const value = input.trim();
    if (!value || tags.includes(value)) return;
    onChange([...tags, value]);
    setInput("");
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-primary/15 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="hover:text-rose-500 transition-colors cursor-pointer"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[80px] bg-transparent text-xs text-text placeholder-textSecondary/60 outline-none"
      />
    </div>
  );
};

/* ─────────────────────────────────────────────
   Toggle Switch
───────────────────────────────────────────── */
const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer ${
        checked ? "bg-primary" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "-translate-x-5" : "-translate-x-0.5"
        }`}
      />
    </button>
    <span className="text-xs font-medium text-text">{label}</span>
  </label>
);

/* ─────────────────────────────────────────────
   Multi Image Picker
───────────────────────────────────────────── */
const MultiImagePicker = ({
  existingImages = [],
  newFiles = [],
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
  maxImages = 5,
}) => {
  const totalCount = existingImages.length + newFiles.length;
  const canAdd = totalCount < maxImages;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = maxImages - totalCount;
    const validFiles = files.slice(0, remaining).filter((file) => {
      if (!file.type.startsWith("image/")) {
        showToast.error("يرجى اختيار ملف صورة صالح");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast.error("حجم الصورة يجب أن يكون أقل من 5 ميغابايت");
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) onAddFiles(validFiles);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {/* Existing images (from Cloudinary) */}
        {existingImages.map((url, i) => (
          <div key={`existing-${i}`} className="relative group">
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-primary/15 bg-surface/40">
              <img
                src={url}
                alt={`صورة ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => onRemoveExisting(i)}
              className="absolute -top-2 -left-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* New file previews */}
        {newFiles.map((file, i) => (
          <div key={`new-${i}`} className="relative group">
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-emerald-300 bg-surface/40">
              <img
                src={URL.createObjectURL(file)}
                alt={`جديدة ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
              جديدة
            </span>
            <button
              type="button"
              onClick={() => onRemoveNew(i)}
              className="absolute -top-2 -left-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {/* Add button */}
        {canAdd && (
          <label className="w-24 h-24 rounded-xl border-2 border-dashed border-primary/25 bg-surface/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
            <ImagePlus size={22} className="text-primary/40" />
            <span className="text-[10px] font-medium text-primary/50 mt-1">
              إضافة
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-[10px] text-textSecondary">
        {totalCount}/{maxImages} صور • الحد الأقصى 5 ميغابايت للصورة (jpg, png,
        webp)
      </p>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Product Form (Create / Edit)
───────────────────────────────────────────── */
const ProductForm = ({ initialData, categories = [], onSubmit, isLoading }) => {
  const isEditing = !!initialData;

  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId?._id || initialData?.categoryId || ""
  );
  const [basePrice, setBasePrice] = useState(initialData?.basePrice ?? "");
  const [sizes, setSizes] = useState(initialData?.sizes || []);
  const [colors, setColors] = useState(initialData?.colors || []);
  const [isAvailable, setIsAvailable] = useState(
    initialData?.isAvailable ?? true
  );
  const [hasDiscountPrice, setHasDiscountPrice] = useState(
    initialData?.hasDiscountPrice ?? false
  );

  // Image state
  const [existingImages, setExistingImages] = useState(
    initialData?.images || []
  );
  const [newFiles, setNewFiles] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  const handleAddFiles = (files) => {
    setNewFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveExisting = (index) => {
    const url = existingImages[index];
    setRemovedImages((prev) => [...prev, url]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNew = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast.error("يرجى إدخال اسم المنتج");
      return;
    }
    if (!categoryId) {
      showToast.error("يرجى اختيار الفئة");
      return;
    }
    if (!basePrice || Number(basePrice) <= 0) {
      showToast.error("يرجى إدخال سعر صحيح");
      return;
    }
    if (!isEditing && newFiles.length === 0) {
      showToast.error("يرجى إضافة صورة واحدة على الأقل");
      return;
    }
    if (isEditing && existingImages.length + newFiles.length === 0) {
      showToast.error("يجب أن يحتوي المنتج على صورة واحدة على الأقل");
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("categoryId", categoryId);
    formData.append("basePrice", Number(basePrice));
    formData.append("sizes", JSON.stringify(sizes));
    formData.append("colors", JSON.stringify(colors));
    formData.append("isAvailable", JSON.stringify(isAvailable));
    formData.append("hasDiscountPrice", JSON.stringify(hasDiscountPrice));

    // Append new image files
    newFiles.forEach((file) => {
      formData.append("images", file);
    });

    // On edit, send removed images list
    if (isEditing && removedImages.length > 0) {
      formData.append("removedImages", JSON.stringify(removedImages));
    }

    onSubmit({
      productId: isEditing ? initialData._id : null,
      formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-cairo">
      {/* Images */}
      <div>
        <label className="block text-sm font-semibold text-text mb-2">
          صور المنتج
        </label>
        <MultiImagePicker
          existingImages={existingImages}
          newFiles={newFiles}
          onAddFiles={handleAddFiles}
          onRemoveExisting={handleRemoveExisting}
          onRemoveNew={handleRemoveNew}
        />
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="product-name"
          className="block text-sm font-semibold text-text mb-1.5"
        >
          اسم المنتج
        </label>
        <input
          id="product-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: ثوب سعودي كلاسيكي..."
          className="w-full px-4 py-2.5 rounded-xl border border-primary/15 bg-white text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="product-desc"
          className="block text-sm font-semibold text-text mb-1.5"
        >
          الوصف
        </label>
        <textarea
          id="product-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="وصف تفصيلي للمنتج..."
          className="w-full px-4 py-2.5 rounded-xl border border-primary/15 bg-white text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
        />
      </div>

      {/* Category + Price row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category Select */}
        <div>
          <label
            htmlFor="product-category"
            className="block text-sm font-semibold text-text mb-1.5"
          >
            الفئة
          </label>
          <div className="relative">
            <select
              id="product-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 rounded-xl border border-primary/15 bg-white text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="">اختر الفئة...</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-textSecondary pointer-events-none"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label
            htmlFor="product-price"
            className="block text-sm font-semibold text-text mb-1.5"
          >
            السعر (ر.س)
          </label>
          <input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2.5 rounded-xl border border-primary/15 bg-white text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Sizes */}
      <div>
        <label className="block text-sm font-semibold text-text mb-1.5">
          المقاسات
        </label>
        <TagInput
          tags={sizes}
          onChange={setSizes}
          placeholder="اكتب المقاس واضغط Enter (مثلاً: S, M, L, XL)"
        />
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-semibold text-text mb-1.5">
          الألوان
        </label>
        <TagInput
          tags={colors}
          onChange={setColors}
          placeholder="اكتب اللون واضغط Enter (مثلاً: أبيض, أسود, بيج)"
        />
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-6 pt-1">
        <Toggle
          checked={isAvailable}
          onChange={setIsAvailable}
          label="متاح للبيع"
        />
        <Toggle
          checked={hasDiscountPrice}
          onChange={setHasDiscountPrice}
          label="يوجد خصم"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {isLoading
          ? "جارٍ الحفظ..."
          : isEditing
            ? "تحديث المنتج"
            : "إضافة المنتج"}
      </button>
    </form>
  );
};

/* ─────────────────────────────────────────────
   Delete Confirmation
───────────────────────────────────────────── */
const DeleteConfirm = ({ product, onConfirm, onCancel, isLoading }) => (
  <div className="text-center space-y-4 font-cairo">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
      <Trash2 size={28} />
    </div>

    {product?.images?.[0] && (
      <img
        src={product.images[0]}
        alt={product.name}
        className="w-16 h-16 rounded-xl object-cover mx-auto border border-primary/10 shadow-xs"
      />
    )}

    <div>
      <h3 className="text-base font-bold text-text">تأكيد حذف المنتج</h3>
      <p className="mt-1 text-xs text-textSecondary">
        هل أنت متأكد من حذف المنتج{" "}
        <strong className="text-text font-bold">"{product?.name}"</strong>؟ سيتم
        حذف جميع الصور المرتبطة. لا يمكن التراجع عن هذا الإجراء.
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
        {isLoading ? "جارٍ الحذف..." : "حذف المنتج"}
      </button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main Products Page
───────────────────────────────────────────── */
function Products() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [overlay, setOverlay] = useState({ type: null, data: null });

  // Debounce search
  const [searchTimer, setSearchTimer] = useState(null);
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
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetProducts({
    page,
    limit,
    categoryId: filterCategory || undefined,
    search: debouncedSearch || undefined,
    isAvailable:
      filterAvailability !== "" ? filterAvailability : undefined,
  });

  const { data: categoryData } = useGetCategories();
  const categories = categoryData?.categories || [];

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const products = data?.products || [];
  const pagination = data?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 10,
  };

  // Overlay handlers
  const openCreate = () => setOverlay({ type: "form", data: null });
  const openEdit = useCallback(
    (product) => setOverlay({ type: "form", data: product }),
    []
  );
  const openDelete = useCallback(
    (product) => setOverlay({ type: "delete", data: product }),
    []
  );
  const closeOverlay = () => setOverlay({ type: null, data: null });

  const handleSubmit = async ({ productId, formData }) => {
    try {
      if (productId) {
        await updateMutation.mutateAsync({ productId, formData });
        showToast.success("تم تحديث المنتج بنجاح");
      } else {
        await createMutation.mutateAsync(formData);
        showToast.success("تمت إضافة المنتج بنجاح");
      }
      closeOverlay();
    } catch (err) {
      showToast.error(
        err.response?.data?.error || err.message || "حدث خطأ غير متوقع"
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(overlay.data._id);
      showToast.success("تم حذف المنتج بنجاح");
      closeOverlay();
    } catch (err) {
      showToast.error(
        err.response?.data?.error || err.message || "فشل حذف المنتج"
      );
    }
  };

  // Date formatter
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

  // DataTable columns
  const columns = useMemo(
    () => [
      {
        key: "image",
        label: "الصورة",
        className: "w-20",
        headerClassName: "w-20",
        render: (product) => (
          <div className="h-12 w-12 rounded-xl overflow-hidden bg-surface/50 border border-primary/10 flex items-center justify-center">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-200 hover:scale-110"
              />
            ) : (
              <Package size={20} className="text-primary/40" />
            )}
          </div>
        ),
      },
      {
        key: "name",
        label: "المنتج",
        render: (product) => (
          <div>
            <span className="font-bold text-text text-xs block">
              {product.name}
            </span>
            <span
              className="text-[10px] text-textSecondary font-mono block mt-0.5"
              dir="ltr"
            >
              ID: {product._id?.slice(0, 10)}...
            </span>
          </div>
        ),
      },
      {
        key: "category",
        label: "الفئة",
        className: "hidden md:table-cell",
        headerClassName: "hidden md:table-cell",
        render: (product) => (
          <span className="inline-flex items-center rounded-lg bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary">
            {product.categoryId?.name || "—"}
          </span>
        ),
      },
      {
        key: "price",
        label: "السعر",
        render: (product) => (
          <span className="font-bold text-text text-xs" dir="ltr">
            {currencyFormate(product.basePrice || 0)}
          </span>
        ),
      },
      {
        key: "status",
        label: "الحالة",
        className: "hidden sm:table-cell",
        headerClassName: "hidden sm:table-cell",
        render: (product) => (
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
              product.isAvailable
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                product.isAvailable ? "bg-emerald-500" : "bg-rose-400"
              }`}
            />
            {product.isAvailable ? "متاح" : "غير متاح"}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: "التاريخ",
        className: "hidden lg:table-cell text-textSecondary text-xs",
        headerClassName: "hidden lg:table-cell",
        render: (product) => formatDate(product.createdAt),
      },
      {
        key: "actions",
        label: "الإجراءات",
        className: "text-center w-24",
        headerClassName: "text-center w-24",
        render: (product) => {
          const menuActions = [
            {
              label: "تعديل",
              icon: Pencil,
              onClick: () => openEdit(product),
            },
            {
              label: "حذف المنتج",
              icon: Trash2,
              danger: true,
              onClick: () => openDelete(product),
            },
          ];
          return <ActionMenu actions={menuActions} />;
        },
      },
    ],
    [openEdit, openDelete]
  );

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            إدارة المنتجات
          </h1>
          <p className="mt-1 text-sm text-textSecondary">
            إضافة وتعديل وإدارة جميع منتجات متجر دكان
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-3.5 py-2.5 text-xs font-semibold text-text transition hover:bg-surface active:scale-95 cursor-pointer disabled:opacity-60"
            title="تحديث القائمة"
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
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary/90 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            إضافة منتج
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 text-textSecondary pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="بحث عن منتج بالاسم أو الوصف..."
              className="w-full rounded-xl border border-primary/15 bg-background/50 py-2.5 pr-10 pl-9 text-xs font-medium text-text placeholder-textSecondary/70 transition outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setPage(1);
                }}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-textSecondary hover:text-primary transition cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-xl border border-primary/15 bg-background/50 py-2.5 pr-4 pl-8 text-xs font-medium text-text transition outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 cursor-pointer"
            >
              <option value="">كل الفئات</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute top-1/2 left-2.5 -translate-y-1/2 text-textSecondary pointer-events-none"
            />
          </div>

          {/* Availability Filter */}
          <div className="relative">
            <select
              value={filterAvailability}
              onChange={(e) => {
                setFilterAvailability(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-xl border border-primary/15 bg-background/50 py-2.5 pr-4 pl-8 text-xs font-medium text-text transition outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 cursor-pointer"
            >
              <option value="">الكل</option>
              <option value="true">متاح</option>
              <option value="false">غير متاح</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute top-1/2 left-2.5 -translate-y-1/2 text-textSecondary pointer-events-none"
            />
          </div>

          {/* Total count */}
          <div className="text-xs text-textSecondary mr-auto">
            إجمالي المنتجات:{" "}
            <strong className="font-bold text-text">
              {pagination.totalProducts}
            </strong>
          </div>
        </div>
      </div>

      {/* Products DataTable */}
      <DataTable
        columns={columns}
        data={products}
        rowKey="_id"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        pagination={{
          totalItems: pagination.totalProducts,
          totalPages: pagination.totalPages,
          currentPage: pagination.currentPage,
          hasNext: pagination.currentPage < pagination.totalPages,
          hasPrev: pagination.currentPage > 1,
        }}
        onPageChange={setPage}
        emptyIcon={Package}
        emptyTitle={
          debouncedSearch || filterCategory || filterAvailability
            ? "لم يتم العثور على منتجات"
            : "لا توجد منتجات بعد"
        }
        emptyDescription={
          debouncedSearch || filterCategory || filterAvailability
            ? "جرّب تغيير معايير البحث أو الفلاتر"
            : "ابدأ بإضافة أول منتج لمتجرك"
        }
        skeletonRows={5}
        skeletonColumns={7}
        skeletonHasAvatar={true}
        itemLabel="منتج"
      />

      {/* Create / Edit Modal */}
      <Overly
        isOpen={overlay.type === "form"}
        onClose={closeOverlay}
        title={overlay.data ? "تعديل المنتج" : "إضافة منتج جديد"}
        maxWidth="max-w-2xl"
      >
        <ProductForm
          key={overlay.data?._id || "create"}
          initialData={overlay.data}
          categories={categories}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Overly>

      {/* Delete Confirmation Modal */}
      <Overly
        isOpen={overlay.type === "delete"}
        onClose={closeOverlay}
        title="حذف المنتج"
        maxWidth="max-w-sm"
      >
        <DeleteConfirm
          product={overlay.data}
          onConfirm={handleDelete}
          onCancel={closeOverlay}
          isLoading={deleteMutation.isPending}
        />
      </Overly>
    </div>
  );
}

export default Products;
