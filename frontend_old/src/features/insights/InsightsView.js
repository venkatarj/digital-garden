import React from 'react';
import { Brain } from 'lucide-react';
import MoodTrend from './charts/MoodTrend';
import TopicDistro from './charts/TopicDistro';

const InsightsView = ({ entries }) => {
    // Simple Analysis
    const totalEntries = entries.length;
    const moodCounts = entries.reduce((acc, e) => { acc[e.mood] = (acc[e.mood] || 0) + 1; return acc; }, {});
    const topMood = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a])[0];
    const uniqueDays = new Set(entries.map(e => e.date)).size;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
            <h2 style={{ color: '#7C9A86', marginBottom: '30px', display: 'flex', gap: '10px', alignItems: 'center' }}><Brain /> Gentle Insights</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                <div className="editor-card" style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#a0aec0', marginBottom: '10px' }}>Your Pattern</h3>
                    <p style={{ fontSize: '18px', color: '#2d3748' }}>
                        You often feel <span style={{ fontSize: '24px' }}>{topMood}</span> when you write.
                    </p>
                </div>
                <div className="editor-card" style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#a0aec0', marginBottom: '10px' }}>Consistency</h3>
                    <p style={{ fontSize: '18px', color: '#2d3748' }}>
                        You have tracked <span style={{ fontWeight: 'bold' }}>{uniqueDays}</span> distinct days.
                    </p>
                </div>
            </div>

            {/* --- CHARTS --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="editor-card" style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#a0aec0' }}>Mood Flow (Last 7)</h3>
                    <MoodTrend entries={entries} />
                </div>
                <div className="editor-card" style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#a0aec0' }}>Top Themes</h3>
                    <TopicDistro entries={entries} />
                </div>
            </div>
        </div>
    );
};

export default InsightsView;
