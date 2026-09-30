import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer, Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import App from './App.jsx'
import ErrorBoundary, { ErrorFallback } from './components/ErrorBoundary.jsx'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (import.meta.env.DEV && !publishableKey) {
  console.error('Missing Clerk Publishable Key in environment variables.')
}
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    {publishableKey ? (
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/landing">
        <QueryClientProvider client={queryClient}>
          <App />
          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={true}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            transition={Bounce}
            theme="light"
            toastStyle={{
              fontFamily: '"Cairo", sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
              direction: 'rtl',
            }}
            progressStyle={{
              background: '#A84F35',
            }}
          />
        </QueryClientProvider>
      </ClerkProvider>
    ) : (
      <ErrorFallback
        title="حدث خطأ ما"
        message="نعتذر، تعذر بدء تشغيل التطبيق في الوقت الحالي. يرجى المحاولة مرة أخرى لاحقاً."
        retryText="إعادة المحاولة"
      />
    )}
  </ErrorBoundary>
)

