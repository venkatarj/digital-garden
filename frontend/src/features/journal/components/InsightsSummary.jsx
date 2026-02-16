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
    const [isOpen, setIsOpen] = useState(false);

    const weeklyCount = entries.filter(e => {
        const d = new Date(e.date || Date.now());
        const now = new Date();
        return d > new Date(now.setDate(now.getDate() - 7));
    }).length;

    return (
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <div onClick={() => setIsOpen(!isOpen)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', cursor: 'pointer', color: 'var(--muted-text)' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--contrast-text)' }}>
                    <BarChart2 size={16} /> Insights
                </h4>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>

            {isOpen && (
                <div className="fade-in-up" style={{ padding: '0 0 20px 0' }}>
                    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '15px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--muted-text)', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>THIS WEEK</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'baseline', gap: '5px', color: 'var(--contrast-text)' }}>
                            <CountUp end={weeklyCount} />
                            <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--muted-text)' }}>entries</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--nothing-red)', marginTop: '10px' }}>Keep the streak alive! 🔥</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InsightsSummary;
