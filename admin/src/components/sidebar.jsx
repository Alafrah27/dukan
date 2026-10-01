import { useState } from "react"
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Truck,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LogIn,
  Gift,
  Scissors,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import { useUser, Show, SignInButton, UserButton } from "@clerk/react"

const links = [
  { to: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/admin/products", label: "المنتجات", icon: Package },
  { to: "/admin/categories", label: "الفئات", icon: Tags },
  { to: "/admin/tailoring", label: "أسعار التفصيل", icon: Scissors },
  { to: "/admin/offers", label: "العروض", icon: Gift },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { to: "/admin/users", label: "المستخدمين", icon: Users },
  { to: "/admin/shipping", label: "الشحن", icon: Truck },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings },
]

function Sidebar({ isCollapsed: controlledCollapsed, onToggle }) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useUser()

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const toggle = onToggle || (() => setInternalCollapsed(prev => !prev))

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-primary/10 bg-white px-4 py-3 shadow-sm md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-sm shadow-primary/20">
            د
          </div>
          <span className="text-xl font-bold text-primary">دكان</span>
        </div>
        <div className="flex items-center gap-2">
          <Show when="signed-in">
            <UserButton />
          </Show>
          <button
            type="button"
            onClick={() => setMobileOpen(prev => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 bg-surface/60 text-primary transition hover:bg-surfaceSelected active:scale-95"
            aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container (Desktop + Mobile drawer) */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex flex-col border-l border-primary/10 bg-white shadow-sm transition-all duration-300 ease-in-out md:z-30 md:shadow-none ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "translate-x-full md:translate-x-0"
        } ${
          isCollapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        {/* Sidebar Header (Logo & Top Toggle Button) */}
        <div
          className={`flex items-center border-b border-primary/10 p-4 transition-all duration-300 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white shadow-sm shadow-primary/20">
              د
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              <span className="block text-xl font-bold tracking-tight text-primary">دكان</span>
              <span className="block text-[11px] font-medium text-textSecondary">لوحة الإدارة</span>
            </div>
          </div>

          {/* Desktop Header Toggle Button */}
          <button
            type="button"
            onClick={toggle}
            aria-label={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
            title={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
            className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-surface/50 text-textSecondary transition-all duration-200 hover:bg-surfaceSelected hover:text-primary active:scale-95 md:flex ${
              isCollapsed ? "hidden" : "flex"
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Navigation links */}
        <nav
          aria-label="القائمة الرئيسية"
          className="flex flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden p-3"
        >
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              title={label}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
                  isCollapsed ? "justify-center px-0 w-full" : "px-3.5"
                } ${
                  isActive
                    ? "bg-primary text-white shadow-sm shadow-primary/25 font-bold"
                    : "text-textSecondary hover:bg-surface hover:text-text"
                }`
              }
            >
              <Icon
                size={20}
                className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                aria-hidden="true"
              />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
                }`}
              >
                {label}
              </span>

              {/* Floating Tooltip for collapsed state on desktop */}
              {isCollapsed && (
                <div className="pointer-events-none absolute end-full top-1/2 z-50 me-2.5 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-text px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 md:block">
                  {label}
                  <div className="absolute top-1/2 -end-1 -translate-y-1/2 border-4 border-transparent border-s-text" />
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Clerk User Profile Section */}
        <div className="border-t border-primary/10 p-3">
          <Show when="signed-in">
            <div
              className={`flex items-center gap-3 rounded-xl p-1.5 transition-all ${
                isCollapsed ? "justify-center" : "justify-start"
              }`}
            >
              <div className="flex shrink-0 items-center justify-center">
                <UserButton />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
                }`}
              >
                <span className="block truncate text-xs font-bold text-text">
                  {user?.fullName || user?.primaryEmailAddress?.emailAddress || "المشرف"}
                </span>
                <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {user?.publicMetadata?.role === "admin" ? "مشرف (Admin)" : "مستخدم"}
                </span>
              </div>
            </div>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className={`flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 active:scale-95 ${
                  isCollapsed ? "justify-center px-0" : ""
                }`}
                title="تسجيل الدخول"
              >
                <LogIn size={16} />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                    isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
                  }`}
                >
                  تسجيل الدخول
                </span>
              </button>
            </SignInButton>
          </Show>
        </div>

        {/* Bottom Toggle Button */}
        <div className="border-t border-primary/10 p-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
            title={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
            className={`group flex w-full items-center gap-3 rounded-xl py-2.5 text-xs font-semibold text-textSecondary transition-all duration-200 hover:bg-surface hover:text-primary active:scale-95 ${
              isCollapsed ? "justify-center px-0" : "px-3"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-surface/70 text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-white">
              {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </span>
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
              }`}
            >
              تصغير القائمة
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
