import { LogOut, LogIn } from "lucide-react"
import { useClerk, SignInButton } from "@clerk/react"

const LandingPage = () => {
  const { signOut } = useClerk()

  return (
    <div className="flex min-h-screen items-center justify-center gap-4 bg-background" dir="rtl">
      <SignInButton mode="modal">
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-95"
        >
          <LogIn size={18} />
          تسجيل الدخول
        </button>
      </SignInButton>

      <button
        type="button"
        onClick={() => signOut()}
        className="flex items-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 active:scale-95"
      >
        <LogOut size={18} />
        تسجيل الخروج
      </button>
    </div>
  )
}

export default LandingPage