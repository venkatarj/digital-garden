import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TopicDistro = ({ entries }) => {
    const tagsCount = {};
    entries.forEach(e => {
        // Extract tags from content "[Tags: work, health]"
        const match = e.content.match(/\[Tags: (.*?)\]/);
        if (match) {
            match[1].split(',').forEach(t => {
                const tag = t.trim().toLowerCase();
                tagsCount[tag] = (tagsCount[tag] || 0) + 1;
            });
        }
    });

    const data = Object.keys(tagsCount)
        .map(tag => ({ name: tag, count: tagsCount[tag] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 tags

    if (data.length === 0) return <p style={{ color: '#a0aec0', padding: '20px', textAlign: 'center' }}>No tags found yet.</p>;

    return (
        <div style={{ height: 200, width: '100%', marginTop: '20px' }}>
            <ResponsiveContainer>
                <BarChart data={data}>
                    <XAxis dataKey="name" tick={{ fill: '#718096', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#7C9A86' : '#A3C4BC'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TopicDistro;
