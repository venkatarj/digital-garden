import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trash2 } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, entryTitle, isDeleting }) => {
    const modalRef = useRef(null);

    // Trap focus and handle Escape key
    useEffect(() => {
        if (isOpen) {
            const handleEscape = (e) => {
                if (e.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleEscape);

            // Focus on Confirm button primarily (safe default for destructive actions?)
            // Usually safest is Cancel. But user wants "Polished delete action".
            // Let's focus Cancel button first.
            const cancelBtn = document.getElementById('cancel-delete-btn');
            if (cancelBtn) cancelBtn.focus();

            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    // Prevent scroll on body when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isDeleting ? onClose : undefined}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
                        className="fixed z-50 w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mx-auto mb-4 flex items-center justify-center">
                                <Trash2 size={24} />
                            </div>

                            <h3 id="modal-title" className="text-xl font-display font-bold text-slate-800 dark:text-white mb-2">
                                Delete Entry?
                            </h3>

                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">"{entryTitle || 'Untitled Entry'}"</span>? This action cannot be undone.
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    id="cancel-delete-btn"
                                    onClick={onClose}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-slate-300 focus:outline-none disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-red-300 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DeleteConfirmModal;
