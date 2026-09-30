import { toast, Bounce } from 'react-toastify';

// Custom toast configuration matching the Dukan theme
const defaultOptions = {
  position: 'top-center',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  transition: Bounce,
  rtl: true,
  theme: 'light',
};

export const showToast = {
  success: (message, options = {}) =>
    toast.success(message, { ...defaultOptions, ...options }),

  error: (message, options = {}) =>
    toast.error(message, { ...defaultOptions, ...options }),

  info: (message, options = {}) =>
    toast.info(message, { ...defaultOptions, ...options }),

  warning: (message, options = {}) =>
    toast.warn(message, { ...defaultOptions, ...options }),

  loading: (message, options = {}) =>
    toast.loading(message, { ...defaultOptions, autoClose: false, ...options }),

  dismiss: (toastId) => toast.dismiss(toastId),

  // Promise-based toast for async operations
  promise: (promise, { pending, success, error }, options = {}) =>
    toast.promise(promise, { pending, success, error }, { ...defaultOptions, ...options }),
};

export default showToast;
