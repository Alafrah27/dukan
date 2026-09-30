import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Users as UsersIcon,
  ShieldCheck,
  UserCheck,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Copy,
  Check,
  UserX,
  Mail,
  Calendar,
  KeyRound,
  Sparkles,
  Loader2,
} from "lucide-react";
import Overly from "../../components/Overly";
import ActionMenu from "../../components/ActionMenu";
import DataTable from "../../components/DataTable";
import { SkeletonStats } from "../../components/Skeleton";
import {
  useGetUsers,
  useUpdateUserRole,
  useDeleteUser,
} from "../../services/userQuery";
import showToast from "../../lib/toast";

function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 8;

  const [copiedId, setCopiedId] = useState(null);

  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);

  // Debounce search input for clean API queries
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1); // Reset to first page on new search
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page when role changes
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setPage(1);
  };

  // Queries & Mutations
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetUsers({
    page,
    limit,
    search: debouncedSearch,
    role: selectedRole,
  });

  const { mutateAsync: updateRole, isPending: isUpdatingRole } = useUpdateUserRole();
  const { mutateAsync: deleteUser, isPending: isDeletingUser } = useDeleteUser();

  const users = data?.users || [];
  const pagination = data?.pagination || {
    totalUsers: 0,
    totalPages: 1,
    currentPage: 1,
    limit,
    hasNext: false,
    hasPrev: false,
  };

  // Metrics
  const stats = useMemo(() => {
    const total = pagination.totalUsers || users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const regular = Math.max(0, total - admins);
    return { total, admins, regular };
  }, [pagination.totalUsers, users]);

  // Copy Clerk ID Helper
  const handleCopyClerkId = useCallback((id) => {
    if (!id) return;
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    showToast.info("تم نسخ معرّف Clerk بنجاح");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Handle Role Toggle (Admin <-> User)
  const handleToggleRole = useCallback(async (userToToggle) => {
    const nextRole = userToToggle.role === "admin" ? "user" : "admin";
    const roleLabel = nextRole === "admin" ? "مشرف" : "عميل";

    try {
      await updateRole({ id: userToToggle._id, role: nextRole });
      showToast.success(`تم تغيير صلاحية ${userToToggle.fullname || "المستخدم"} إلى ${roleLabel}`);

      if (activeUser && activeUser._id === userToToggle._id) {
        setActiveUser((prev) => ({ ...prev, role: nextRole }));
      }
    } catch (err) {
      showToast.error(err.message || "فشل تغيير الصلاحية");
    }
  }, [activeUser, updateRole]);

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!activeUser) return;

    try {
      await deleteUser(activeUser._id);
      showToast.success(`تم حذف حساب ${activeUser.fullname || "المستخدم"} بنجاح`);
      setIsDeleteModalOpen(false);
      setActiveUser(null);
    } catch (err) {
      showToast.error(err.message || "فشل حذف المستخدم");
    }
  };

  // Format Date Helper
  const formatDate = (dateString) => {
    if (!dateString) return "غير متوفر";
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

  // Table Columns Definition
  const columns = useMemo(
    () => [
      {
        key: "user",
        label: "المستخدم",
        render: (u) => {
          const initialLetter = u.fullname
            ? u.fullname.trim().charAt(0)
            : "م";
          return (
            <div className="flex items-center gap-3">
              {u.imageUrl ? (
                <img
                  src={u.imageUrl}
                  alt={u.fullname}
                  className="h-9 w-9 rounded-xl object-cover border border-primary/10"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface font-bold text-primary shadow-xs">
                  {initialLetter}
                </div>
              )}
              <div className="min-w-0">
                <span className="block truncate font-bold text-text">
                  {u.fullname || "مستخدم بدون اسم"}
                </span>
                <span
                  className="block truncate text-[11px] text-textSecondary"
                  dir="ltr"
                >
                  {u.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "role",
        label: "الصلاحية",
        render: (u) => {
          const isAdmin = u.role === "admin";
          return isAdmin ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              <ShieldCheck size={13} />
              مشرف (Admin)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-[11px] font-semibold text-textSecondary">
              <UserCheck size={13} />
              عميل
            </span>
          );
        },
      },
      {
        key: "clerkId",
        label: "معرّف Clerk",
        className: "hidden md:table-cell",
        headerClassName: "hidden md:table-cell",
        render: (u) => (
          <div className="flex items-center gap-2">
            <code
              className="rounded bg-surface/70 px-2 py-0.5 font-mono text-[11px] text-textSecondary"
              dir="ltr"
            >
              {u.clerkId ? `${u.clerkId.slice(0, 14)}...` : "—"}
            </code>
            {u.clerkId && (
              <button
                type="button"
                onClick={() => handleCopyClerkId(u.clerkId)}
                className="rounded p-1 text-textSecondary hover:bg-surface hover:text-primary transition cursor-pointer"
                title="نسخ معرّف Clerk"
              >
                {copiedId === u.clerkId ? (
                  <Check
                    size={13}
                    className="text-emerald-600"
                  />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            )}
          </div>
        ),
      },
      {
        key: "createdAt",
        label: "تاريخ الانضمام",
        className: "hidden sm:table-cell text-textSecondary",
        headerClassName: "hidden sm:table-cell",
        render: (u) => formatDate(u.createdAt),
      },
      {
        key: "actions",
        label: "الإجراءات",
        className: "text-center",
        headerClassName: "text-center",
        render: (u) => {
          const isAdmin = u.role === "admin";
          const menuActions = [
            {
              label: "عرض التفاصيل",
              icon: Eye,
              onClick: () => {
                setActiveUser(u);
                setIsViewModalOpen(true);
              },
            },
            {
              label: isAdmin ? "تعيين كعميل" : "ترقية إلى مشرف",
              icon: ShieldCheck,
              onClick: () => handleToggleRole(u),
            },
            {
              label: "حذف الحساب",
              icon: Trash2,
              danger: true,
              onClick: () => {
                setActiveUser(u);
                setIsDeleteModalOpen(true);
              },
            },
          ];
          return <ActionMenu actions={menuActions} />;
        },
      },
    ],
    [copiedId, handleCopyClerkId, handleToggleRole]
  );

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            إدارة المستخدمين
          </h1>
          <p className="mt-1 text-sm text-textSecondary">
            إدارة حسابات مستخدمي متجر دكان وصلاحيات الوصول إلى لوحة الإدارة
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
        </div>
      </div>

      {/* Stats Summary Cards (with Skeleton Loader) */}
      {isLoading ? (
        <SkeletonStats count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Users */}
          <div className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white p-5 shadow-xs">
            <div>
              <span className="text-xs font-semibold text-textSecondary">
                إجمالي المستخدمين
              </span>
              <div className="mt-1 text-2xl font-bold text-text">
                {stats.total}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-primary">
              <UsersIcon size={24} />
            </div>
          </div>

          {/* Admins */}
          <div className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white p-5 shadow-xs">
            <div>
              <span className="text-xs font-semibold text-textSecondary">
                المشرفون (Admins)
              </span>
              <div className="mt-1 text-2xl font-bold text-primary">
                {stats.admins}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck size={24} />
            </div>
          </div>

          {/* Regular Customers / Users */}
          <div className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white p-5 shadow-xs">
            <div>
              <span className="text-xs font-semibold text-textSecondary">
                العملاء والمستخدمين
              </span>
              <div className="mt-1 text-2xl font-bold text-text">
                {stats.regular}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-textSecondary">
              <UserCheck size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-textSecondary pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو البريد الإلكتروني..."
            className="w-full rounded-xl border border-primary/15 bg-background/50 py-2.5 pr-10 pl-4 text-xs font-medium text-text placeholder-textSecondary/70 transition outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: "الكل" },
            { id: "admin", label: "المشرفين" },
            { id: "user", label: "العملاء" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleRoleChange(tab.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                selectedRole === tab.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface/50 text-textSecondary hover:bg-surface hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={users}
        rowKey="_id"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        pagination={{
          totalItems: pagination.totalUsers,
          totalPages: pagination.totalPages,
          currentPage: pagination.currentPage,
          hasNext: pagination.hasNext,
          hasPrev: pagination.hasPrev,
        }}
        onPageChange={setPage}
        emptyIcon={UserX}
        emptyTitle="لم يتم العثور على مستخدمين"
        emptyDescription="جرب البحث بكلمات أخرى أو تغيير الفلتر"
        skeletonRows={limit}
        skeletonColumns={5}
        skeletonHasAvatar={true}
        itemLabel="مستخدم"
      />

      {/* MODAL 1: View User Details */}
      <Overly
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="تفاصيل المستخدم"
        maxWidth="max-w-md"
      >
        {activeUser && (
          <div className="space-y-4">
            {/* User Avatar & Headline */}
            <div className="flex items-center gap-3.5 rounded-2xl border border-primary/10 bg-surface/30 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-xs">
                {activeUser.fullname ? activeUser.fullname.charAt(0) : "م"}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-text text-sm">
                  {activeUser.fullname}
                </h3>
                <div
                  className="flex items-center gap-1.5 text-xs text-textSecondary"
                  dir="ltr"
                >
                  <Mail size={13} className="shrink-0 text-primary" />
                  <span className="truncate">{activeUser.email}</span>
                </div>
              </div>
            </div>

            {/* Info Items */}
            <div className="space-y-2.5 rounded-2xl border border-primary/10 p-4 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2 text-textSecondary">
                  <KeyRound size={14} className="text-primary" />
                  معرّف Clerk (ID):
                </span>
                <span className="font-mono text-[11px] text-text" dir="ltr">
                  {activeUser.clerkId || "غير متوفر"}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-primary/5 py-1">
                <span className="flex items-center gap-2 text-textSecondary">
                  <Calendar size={14} className="text-primary" />
                  تاريخ التسجيل:
                </span>
                <span className="text-text">
                  {formatDate(activeUser.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-primary/5 py-1">
                <span className="flex items-center gap-2 text-textSecondary">
                  <Sparkles size={14} className="text-primary" />
                  الحالة والصلاحية:
                </span>
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    activeUser.role === "admin"
                      ? "bg-primary/10 text-primary"
                      : "bg-surface text-textSecondary"
                  }`}
                >
                  {activeUser.role === "admin" ? "مشرف (Admin)" : "عميل عادي"}
                </span>
              </div>
            </div>

            {/* Role switch toggle */}
            <div className="rounded-2xl border border-primary/10 bg-surface/20 p-4">
              <span className="mb-2 block text-xs font-bold text-text">
                تغيير الصلاحية
              </span>
              <button
                type="button"
                disabled={isUpdatingRole}
                onClick={() => handleToggleRole(activeUser)}
                className="flex w-full items-center justify-between rounded-xl border border-primary/15 bg-white p-3 text-xs font-semibold text-text transition hover:border-primary active:scale-98 cursor-pointer disabled:opacity-60"
              >
                <span>
                  تحويل الحساب إلى{" "}
                  <strong className="text-primary">
                    {activeUser.role === "admin" ? "عميل عادي" : "مشرف (Admin)"}
                  </strong>
                </span>
                {isUpdatingRole ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : (
                  <ShieldCheck size={16} className="text-primary" />
                )}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Overly>

      {/* MODAL 2: Delete Confirmation */}
      <Overly
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="تأكيد حذف المستخدم"
        maxWidth="max-w-sm"
      >
        {activeUser && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 size={28} />
            </div>

            <h3 className="text-base font-bold text-text">
              هل أنت متأكد من الحذف؟
            </h3>
            <p className="text-xs leading-relaxed text-textSecondary">
              سيتم حذف حساب{" "}
              <strong className="text-text">{activeUser.fullname}</strong> نهائياً
              وإلغاء صلاحياته من متجر دكان.
            </p>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingUser}
                className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-textSecondary transition hover:bg-surface cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeletingUser}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {isDeletingUser ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {isDeletingUser ? "جارٍ الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        )}
      </Overly>
    </div>
  );
}

export default Users;
