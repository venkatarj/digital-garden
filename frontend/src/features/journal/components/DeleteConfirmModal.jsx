import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trash2 } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isDeleting }) => {
    const cancelRef = useRef(null);

    // Trap focus and handle Escape key
    useEffect(() => {
        if (isOpen) {
            const handleEscape = (e) => {
                if (e.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleEscape);

            // Focus Cancel button (safe default for destructive actions)
            setTimeout(() => cancelRef.current?.focus(), 100);

            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    // Prevent scroll on body when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => (document.body.style.overflow = 'unset');
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
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.45)',
                            backdropFilter: 'blur(6px)',
                            WebkitBackdropFilter: 'blur(6px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            padding: '16px'
                        }}
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-modal-title"
                        initial={{ opacity: 0, scale: 0.92, y: -24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 12 }}
                        transition={{ type: 'spring', duration: 0.35, bounce: 0.18 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10000,
                            width: '100%',
                            maxWidth: '400px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25), 0 8px 20px -6px rgba(0,0,0,0.15)',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ padding: '28px 24px 24px', textAlign: 'center' }}>
                            {/* Icon */}
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                color: '#ef4444'
                            }}>
                                <Trash2 size={22} />
                            </div>

                            {/* Title */}
                            {/* Title */}
                            <h3
                                id="delete-modal-title"
                                style={{
                                    margin: '0 0 8px',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: 'var(--contrast-text)',
                                    fontFamily: 'var(--font-display), Georgia, serif'
                                }}
                            >
                                {title || 'Delete Item?'}
                            </h3>

                            {/* Message */}
                            <p style={{
                                margin: '0 0 24px',
                                fontSize: '14px',
                                color: 'var(--muted-text)',
                                lineHeight: 1.5
                            }}>
                                {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
                            </p>

                            {/* Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'center'
                            }}>
                                <button
                                    ref={cancelRef}
                                    onClick={onClose}
                                    disabled={isDeleting}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--contrast-text)',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                                        opacity: isDeleting ? 0.5 : 1,
                                        fontFamily: 'var(--font-sans)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isDeleting}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: isDeleting
                                            ? 'rgba(239, 68, 68, 0.7)'
                                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                                        fontFamily: 'var(--font-sans)',
                                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
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
