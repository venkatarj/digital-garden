import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastNotification = ({ message, type = 'success', onClose, isVisible }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 50, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    layout
                    className={`
            fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md
            ${type === 'success'
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                            : 'bg-red-50/90 border-red-200 text-red-800'
                        }
          `}
                >
                    {type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    <span className="font-medium text-sm">{message}</span>
                    <button
                        onClick={onClose}
                        className={`ml-2 p-1 rounded-full bg-black/5 hover:bg-black/10 transition-colors ${type === 'success' ? 'text-emerald-900' : 'text-red-900'}`}
                    >
                        <X size={12} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ToastNotification;
