import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MoodTrend = ({ entries }) => {
    const moodValues = { '😄': 5, '🙂': 4, '😐': 3, '😞': 2, '😡': 1 };

    // prepare data: reverse copy to show oldest to newest, take last 7
    const data = [...entries].reverse().slice(-7).map((e, i) => ({
        day: i, // simple index or use date
        value: moodValues[e.mood] || 3,
        label: e.mood
    }));

    if (data.length < 2) return <p style={{ color: '#a0aec0', padding: '20px', textAlign: 'center' }}>Not enough data for trend.</p>;

    return (
        <div style={{ height: 200, width: '100%', marginTop: '20px' }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <XAxis hide />
                    <YAxis hide domain={[1, 5]} />
                    <Tooltip
                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [value, 'Mood Level']}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#7C9A86"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#7C9A86' }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MoodTrend;
