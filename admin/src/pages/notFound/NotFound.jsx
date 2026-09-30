import { useNavigate } from "react-router-dom"
import { FileQuestion, Home, ArrowRight } from "lucide-react"

function NotFound() {
  const navigate = useNavigate()

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12 text-center font-cairo"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-2xl border border-primary/15 bg-white p-8 shadow-sm">
        {/* Visual Icon Badge */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface text-primary shadow-xs">
          <FileQuestion size={40} strokeWidth={2.2} />
        </div>

        {/* 404 Tag */}
        <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-bold text-primary">
          خطأ 404
        </span>

        {/* Title & Description */}
        <h1 className="mb-2 text-2xl font-bold text-text">الصفحة غير موجودة</h1>
        <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-textSecondary">
          عذراً، الصفحة أو الرابط الذي تحاول الوصول إليه غير موجود، أو ربما تم نقله أو تغييره.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 cursor-pointer"
          >
            <Home size={17} />
            العودة للرئيسية
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-surface/60 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-surfaceSelected active:scale-95 cursor-pointer"
          >
            <ArrowRight size={17} />
            الصفحة السابقة
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
