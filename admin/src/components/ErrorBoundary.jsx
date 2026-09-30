import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export function ErrorFallback({
  title = 'حدث خطأ ما',
  message = 'نعتذر عن هذا الخطأ غير المتوقع أثناء تحميل النظام. يرجى إعادة المحاولة لاحقاً.',
  onRetry = () => window.location.reload(),
  retryText = 'تحديث الصفحة',
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center font-cairo" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-primary/15 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-primary shadow-xs">
          <AlertTriangle size={28} />
        </div>
        <h2 className="mb-2 text-xl font-bold text-text">{title}</h2>
        <p className="mb-6 text-sm leading-relaxed text-textSecondary">
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 cursor-pointer"
        >
          <RefreshCw size={16} />
          {retryText}
        </button>
      </div>
    </div>
  )
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback />
    }

    return this.props.children
  }
}

export default ErrorBoundary
