import  { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { EllipsisVertical } from 'lucide-react';

function ActionMenu({ actions }) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);

    // Calculate portal menu position relative to the trigger button
    const updatePosition = useCallback(() => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        const menuWidth = 160;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < 180 && rect.top > 180;

        // Ensure menu doesn't overflow horizontally
        const optimalLeft = Math.max(
            12,
            Math.min(window.innerWidth - menuWidth - 12, rect.right + window.scrollX - menuWidth)
        );

        const optimalTop = openUpwards
            ? rect.top + window.scrollY - 10
            : rect.bottom + window.scrollY + 6;

        setMenuPos({
            top: optimalTop,
            left: optimalLeft,
            openUpwards,
        });
    }, []);

    // Close when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event) {
            if (
                btnRef.current && !btnRef.current.contains(event.target) &&
                menuRef.current && !menuRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }

        function handleScroll() {
            setIsOpen(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    // Update position when opened
    useEffect(() => {
        if (isOpen) updatePosition();
    }, [isOpen, updatePosition]);

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center ${
                    isOpen
                        ? 'bg-primary/10 text-primary'
                        : 'text-textSecondary hover:text-primary hover:bg-surface'
                }`}
                title="خيارات"
            >
                <EllipsisVertical size={16} />
            </button>

            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            top: menuPos.top,
                            left: menuPos.left,
                            transform: menuPos.openUpwards ? 'translateY(-100%)' : 'none',
                            zIndex: 9999,
                        }}
                        className="w-40 bg-white border border-primary/15 rounded-2xl shadow-xl overflow-hidden py-1.5 font-cairo text-right"
                        dir="rtl"
                    >
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    action.onClick();
                                }}
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition-all text-right cursor-pointer ${
                                    action.danger
                                        ? 'text-rose-600 hover:bg-rose-50 border-t border-primary/10 mt-1'
                                        : 'text-text hover:bg-surface hover:text-primary'
                                }`}
                            >
                                {action.icon && (
                                    <action.icon
                                        size={15}
                                        className={`flex-shrink-0 ${action.danger ? 'text-rose-500' : 'text-primary'}`}
                                    />
                                )}
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
        </>
    );
}

export default ActionMenu;
