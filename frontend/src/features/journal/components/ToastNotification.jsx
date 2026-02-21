import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X, RotateCcw } from 'lucide-react';

const ToastNotification = ({ message, type = 'success', onClose, isVisible, onUndo }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, x: '-50%', scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                    exit={{ opacity: 0, y: -20, x: '-50%', scale: 0.95 }}
                    style={{
                        position: 'fixed',
                        top: '24px',
                        left: '50%',
                        zIndex: 10001,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        minWidth: '320px',
                        maxWidth: '90vw'
                    }}
                >
                    {/* Icon */}
                    <div style={{
                        color: type === 'success' ? '#10b981' : '#ef4444',
                        display: 'flex',
                        flexShrink: 0
                    }}>
                        {type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </div>

                    {/* Message */}
                    <span style={{
                        flex: 1,
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--contrast-text)',
                        lineHeight: 1.4
                    }}>
                        {message}
                    </span>

                    {/* Actions Area */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {onUndo && type === 'success' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUndo();
                                    onClose();
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'var(--accent-primary)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                            >
                                <RotateCcw size={12} />
                                Undo
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--muted-text)',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '50%',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--contrast-text)'}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ToastNotification;
