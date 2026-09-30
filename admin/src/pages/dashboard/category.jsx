import { useState, useMemo, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  Search,
  Layers,
  RefreshCw,
} from "lucide-react";
import {
  useGetCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../services/categoryQuery";
import Overly from "../../components/Overly";
import ActionMenu from "../../components/ActionMenu";
import DataTable from "../../components/DataTable";
import readFileAsDataUrl from "../../lib/readFileUrl";
import showToast from "../../lib/toast";

/* ─── Category Form (inside Overlay) ─── */
const CategoryForm = ({ initialData, onSubmit, isLoading }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [preview, setPreview] = useState(initialData?.image || "");
  const [imageData, setImageData] = useState(null);

  const isEditing = !!initialData;

  const handleImageChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("يرجى اختيار ملف صورة صالح");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast.error("حجم الصورة يجب أن يكون أقل من 5 ميجا");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setPreview(dataUrl);
    setImageData(dataUrl);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast.error("يرجى إدخال اسم الفئة");
      return;
    }
    if (!isEditing && !imageData) {
      showToast.error("يرجى اختيار صورة للفئة");
      return;
    }

    const payload = { name: name.trim() };
    if (imageData) payload.image = imageData;
    if (isEditing) payload.categoryId = initialData._id;

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-cairo">
      {/* Image Upload */}
      <div className="flex flex-col items-center gap-3">
        <label
          htmlFor="category-image"
          className="relative w-36 h-36 rounded-2xl border-2 border-dashed border-primary/25 bg-surface/40 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group"
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="معاينة"
                className="w-full h-full object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                <Pencil size={22} className="text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-primary/50">
              <ImagePlus size={28} />
              <span className="text-xs font-medium">رفع صورة</span>
            </div>
          )}
        </label>
        <input
          type="file"
          id="category-image"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <span className="text-xs text-textSecondary">
          انقر لاختيار صورة (أقل من 5 ميغابايت)
        </span>
      </div>

      {/* Name Input */}
      <div>
        <label
          htmlFor="category-name"
          className="block text-sm font-semibold text-text mb-1.5"
        >
          اسم الفئة
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثال: إلكترونيات، عطور، ملابس..."
          className="w-full px-4 py-2.5 rounded-xl border border-primary/15 bg-white text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
            ? "تحديث الفئة"
            : "إضافة الفئة"}
      </button>
    </form>
  );
};

/* ─── Delete Confirmation ─── */
const DeleteConfirm = ({ category, onConfirm, onCancel, isLoading }) => (
  <div className="text-center space-y-4 font-cairo">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
      <Trash2 size={28} />
    </div>

    {category?.image && (
      <img
        src={category.image}
        alt={category.name}
        className="w-16 h-16 rounded-xl object-cover mx-auto border border-primary/10 shadow-xs"
      />
    )}

    <div>
      <h3 className="text-base font-bold text-text">تأكيد حذف الفئة</h3>
      <p className="mt-1 text-xs text-textSecondary">
        هل أنت متأكد من حذف الفئة{" "}
        <strong className="text-text font-bold">"{category?.name}"</strong>؟
        لا يمكن التراجع عن هذا الإجراء.
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
        {isLoading ? "جارٍ الحذف..." : "حذف الفئة"}
      </button>
    </div>
  </div>
);

/* ─── Main Category Page ─── */
function Category() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;
  const [overlay, setOverlay] = useState({ type: null, data: null });

  // Queries & Mutations
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const categories = data?.categories || [];

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim().toLowerCase();
    return categories.filter((cat) => cat.name?.toLowerCase().includes(q));
  }, [categories, search]);

  // Client-side pagination
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  // Handlers
  const openCreate = () => setOverlay({ type: "form", data: null });
  const openEdit = useCallback((cat) => setOverlay({ type: "form", data: cat }), []);
  const openDelete = useCallback((cat) => setOverlay({ type: "delete", data: cat }), []);
  const closeOverlay = () => setOverlay({ type: null, data: null });

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSubmit = async (payload) => {
    try {
      if (payload.categoryId) {
        await updateMutation.mutateAsync(payload);
        showToast.success("تم تحديث الفئة بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        showToast.success("تمت إضافة الفئة بنجاح");
      }
      closeOverlay();
    } catch (err) {
      showToast.error(
        err.response?.data?.error || err.message || "حدث خطأ غير متوقع",
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(overlay.data._id);
      showToast.success("تم حذف الفئة بنجاح");
      closeOverlay();
    } catch (err) {
      showToast.error(
        err.response?.data?.error || err.message || "فشل حذف الفئة",
      );
    }
  };

  // Date Formatter
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

  // Columns definition for DataTable
  const columns = useMemo(
    () => [
      {
        key: "image",
        label: "الصورة",
        className: "w-20",
        headerClassName: "w-20",
        render: (cat) => (
          <div className="h-12 w-12 rounded-xl overflow-hidden bg-surface/50 border border-primary/10 flex items-center justify-center">
            {cat.image ? (
              <img
                src={cat.image}
                alt={cat.name}
                className="h-full w-full object-cover transition-transform duration-200 hover:scale-110"
              />
            ) : (
              <Layers size={20} className="text-primary/40" />
            )}
          </div>
        ),
      },
      {
        key: "name",
        label: "اسم الفئة",
        render: (cat) => (
          <div>
            <span className="font-bold text-text text-xs block">
              {cat.name}
            </span>
            <span
              className="text-[10px] text-textSecondary font-mono block mt-0.5"
              dir="ltr"
            >
              ID: {cat._id?.slice(0, 10)}...
            </span>
          </div>
        ),
      },
      {
        key: "createdAt",
        label: "تاريخ الإنشاء",
        className: "hidden sm:table-cell text-textSecondary text-xs",
        headerClassName: "hidden sm:table-cell",
        render: (cat) => formatDate(cat.createdAt),
      },
      {
        key: "actions",
        label: "الإجراءات",
        className: "text-center w-24",
        headerClassName: "text-center w-24",
        render: (cat) => {
          const menuActions = [
            {
              label: "تعديل",
              icon: Pencil,
              onClick: () => openEdit(cat),
            },
            {
              label: "حذف الفئة",
              icon: Trash2,
              danger: true,
              onClick: () => openDelete(cat),
            },
          ];
          return <ActionMenu actions={menuActions} />;
        },
      },
    ],
    [openEdit, openDelete],
  );

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            إدارة الفئات
          </h1>
          <p className="mt-1 text-sm text-textSecondary">
            تنظيم وتصنيف منتجات متجر دكان لسهولة التصفح والوصول
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
            إضافة فئة
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-textSecondary pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="بحث عن فئة بالاسم..."
            className="w-full rounded-xl border border-primary/15 bg-background/50 py-2.5 pr-10 pl-9 text-xs font-medium text-text placeholder-textSecondary/70 transition outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
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

        <div className="text-xs text-textSecondary">
          إجمالي الفئات:{" "}
          <strong className="font-bold text-text">{categories.length}</strong>
        </div>
      </div>

      {/* Categories DataTable */}
      <DataTable
        columns={columns}
        data={paginatedCategories}
        rowKey="_id"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        pagination={{
          totalItems,
          totalPages,
          currentPage: page,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }}
        onPageChange={setPage}
        emptyIcon={Layers}
        emptyTitle={search ? "لم يتم العثور على فئات" : "لا توجد فئات بعد"}
        emptyDescription={
          search
            ? `لا توجد نتائج مطابقة لبحثك عن "${search}"`
            : "ابدأ بإضافة أول فئة لتنظيم وتصنيف منتجات متجرك"
        }
        skeletonRows={5}
        skeletonColumns={4}
        skeletonHasAvatar={true}
        itemLabel="فئة"
      />

      {/* Create / Edit Modal */}
      <Overly
        isOpen={overlay.type === "form"}
        onClose={closeOverlay}
        title={overlay.data ? "تعديل الفئة" : "إضافة فئة جديدة"}
      >
        <CategoryForm
          key={overlay.data?._id || "create"}
          initialData={overlay.data}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Overly>

      {/* Delete Confirmation Modal */}
      <Overly
        isOpen={overlay.type === "delete"}
        onClose={closeOverlay}
        title="حذف الفئة"
        maxWidth="max-w-sm"
      >
        <DeleteConfirm
          category={overlay.data}
          onConfirm={handleDelete}
          onCancel={closeOverlay}
          isLoading={deleteMutation.isPending}
        />
      </Overly>
    </div>
  );
}

export default Category;

