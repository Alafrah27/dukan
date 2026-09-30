
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

function Overly({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
    // Prevent background scrolling when overlay is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close on Escape key press
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center p-4 sm:p-6 font-cairo m-0"
            dir="rtl"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop with full screen coverage and blur */}
            <div
                className="fixed inset-0 h-full w-full bg-slate-900/60 backdrop-blur-sm transition-opacity cursor-pointer"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className={`relative w-full ${maxWidth} bg-white rounded-3xl border border-primary/15 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 z-10 my-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-primary/10 shrink-0">
                    <h2 className="text-xl font-bold text-text">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-textSecondary hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="إغلاق"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Body (Scrollable if content is too long) */}
                <div className="p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default Overly;
