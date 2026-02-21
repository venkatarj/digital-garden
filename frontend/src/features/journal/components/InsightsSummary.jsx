import React, { useState, useEffect } from 'react';
import { BarChart2, ChevronDown, ChevronUp } from 'lucide-react';

// Helper: Animate numbers
const CountUp = ({ end, duration = 1000 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.ceil(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [end, duration]);
    return <>{count}</>;
};

const InsightsSummary = ({ entries }) => {
    const weeklyCount = entries.filter(e => {
        const d = new Date(e.date || Date.now());
        const now = new Date();
        const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        return d > oneWeekAgo;
    }).length;

    return (
        <div className="fade-in-up" style={{ padding: '10px 5px' }}>
            <div style={{
                background: 'var(--bg-secondary)', // slightly different bg to pop
                border: '1px solid var(--border-color)',
                padding: '24px',
                borderRadius: '32px', // user requested "rectangular circle shape"
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{
                    fontSize: '11px',
                    color: 'var(--muted-text)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <BarChart2 size={12} />
                    THIS WEEK
                </div>

                <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-primary">
                        <CountUp end={weeklyCount} duration={2} className="text-4xl font-display font-bold" />
                    </span>
                    <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">Entries</span>
                </div>

                <div style={{
                    fontSize: '12px',
                    color: 'var(--nothing-red)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    width: 'fit-content',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    Keep the streak alive! 🔥
                </div>
            </div>
        </div>
    );
};

export default InsightsSummary;
