import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MoodTrend = ({ entries }) => {
    // Map moods to numerical values
    const moodMap = { '😄': 5, '🙂': 4, '😐': 3, '😞': 2, '😡': 1 };

    // Process data: Sort by date, map to values
    const data = [...entries]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(e => ({
            date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: moodMap[e.mood] || 3,
            mood: e.mood,
            fullDate: e.date
        }));

    if (data.length < 2) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                Need more entries to show a trend.
            </div>
        );
    }

    return (
        <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        padding={{ left: 10, right: 10 }}
                    />
                    <YAxis hide domain={[1, 5]} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            padding: '12px'
                        }}
                        cursor={{ stroke: '#8B5CF6', strokeWidth: 2 }}
                        formatter={(value, name, props) => [props.payload.mood, 'Mood']}
                        labelStyle={{ color: '#6B7280', marginBottom: '4px', fontSize: '12px' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8B5CF6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorMood)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MoodTrend;
