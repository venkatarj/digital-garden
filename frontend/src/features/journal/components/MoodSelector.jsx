import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOODS = [
    { value: '😡', emoji: '😡', label: 'Angry', color: '#ef4444' },
    { value: '😞', emoji: '😞', label: 'Sad', color: '#f97316' },
    { value: '😐', emoji: '😐', label: 'Neutral', color: '#a3a3a3' },
    { value: '🙂', emoji: '🙂', label: 'Good', color: '#84cc16' },
    { value: '😄', emoji: '😄', label: 'Happy', color: '#22c55e' },
];

const MoodSelector = ({ selectedMood, onSelectMood, onPreview }) => {
    const getMoodIndex = (mood) => {
        const idx = MOODS.findIndex(m => m.value === mood);
        return idx >= 0 ? idx : 2;
    };

    const [sliderValue, setSliderValue] = useState(getMoodIndex(selectedMood) * 25);
    const [isDragging, setIsDragging] = useState(false);
    const [justSnapped, setJustSnapped] = useState(false);

    useEffect(() => {
        if (!isDragging) {
            setSliderValue(getMoodIndex(selectedMood) * 25);
        }
    }, [selectedMood]);

    const getCurrentMood = (value) => {
        const index = Math.round(value / 25);
        return MOODS[Math.min(Math.max(index, 0), 4)];
    };

    const handleSliderChange = (e) => {
        const value = parseInt(e.target.value);
        setSliderValue(value);
        const mood = getCurrentMood(value);
        if (onPreview) onPreview(mood.value);
    };

    const handleSliderRelease = () => {
        const snappedValue = Math.round(sliderValue / 25) * 25;
        setSliderValue(snappedValue);
        setIsDragging(false);
        setJustSnapped(true);
        const mood = getCurrentMood(snappedValue);
        onSelectMood(mood.value);
        if (onPreview) onPreview(null);
        setTimeout(() => setJustSnapped(false), 500);
    };

    const currentMood = getCurrentMood(sliderValue);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            {/* Slider Track Container - Frosted Glass Pill */}
            <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.35)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '28px',
                padding: '18px 24px 12px',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.4)',
                position: 'relative'
            }}>
                {/* Gradient Track */}
                <div style={{
                    position: 'relative',
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(0,0,0,0.06)',
                }}>
                    {/* Filled gradient portion */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${sliderValue}%`,
                        borderRadius: '3px',
                        background: `linear-gradient(to right, #ef4444, ${currentMood.color})`,
                        transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: `0 0 12px ${currentMood.color}50`
                    }} />

                    {/* Snap dots */}
                    {MOODS.map((mood, i) => (
                        <div
                            key={mood.value}
                            onClick={() => {
                                setSliderValue(i * 25);
                                onSelectMood(mood.value);
                                setJustSnapped(true);
                                setTimeout(() => setJustSnapped(false), 500);
                            }}
                            style={{
                                position: 'absolute',
                                left: `${i * 25}%`,
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: sliderValue >= i * 25 ? '8px' : '6px',
                                height: sliderValue >= i * 25 ? '8px' : '6px',
                                borderRadius: '50%',
                                background: sliderValue >= i * 25 ? mood.color : 'rgba(0,0,0,0.12)',
                                border: '2px solid rgba(255,255,255,0.9)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                zIndex: 2
                            }}
                        />
                    ))}

                    {/* Small track thumb indicator */}
                    <motion.div
                        animate={{ left: `${sliderValue}%` }}
                        transition={{ duration: isDragging ? 0.02 : 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: currentMood.color,
                            border: '3px solid white',
                            boxShadow: `0 2px 8px ${currentMood.color}60`,
                            zIndex: 3,
                            pointerEvents: 'none',
                        }}
                    />
                </div>

                {/* Invisible Range Input */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    onChange={handleSliderChange}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={handleSliderRelease}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={handleSliderRelease}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        left: '24px',
                        right: '24px',
                        width: 'calc(100% - 48px)',
                        height: '36px',
                        opacity: 0,
                        cursor: 'grab',
                        zIndex: 10,
                        margin: 0,
                    }}
                />

                {/* Mood Label */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentMood.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            textAlign: 'center',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: currentMood.color,
                            marginTop: '8px',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                        }}
                    >
                        {currentMood.label}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Emoji displayed to the RIGHT of the bar */}
            <motion.div
                animate={{
                    scale: justSnapped ? [1, 1.5, 0.9, 1.1, 1] : 1,
                    rotate: justSnapped ? [0, -12, 12, -5, 0] : 0,
                }}
                transition={{
                    scale: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
                    rotate: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
                }}
                style={{
                    fontSize: '36px',
                    filter: `drop-shadow(0 4px 10px ${currentMood.color}50)`,
                    userSelect: 'none',
                    flexShrink: 0,
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.span
                        key={currentMood.emoji}
                        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {currentMood.emoji}
                    </motion.span>
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default MoodSelector;
