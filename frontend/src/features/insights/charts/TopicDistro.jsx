import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';

const TopicDistro = ({ entries }) => {
    const tagsCount = {};
    entries.forEach(e => {
        // Extract tags from content "[Tags: work, health]"
        // Also support hashtags like #work #health
        const tagBlockMatch = e.content.match(/\[Tags: (.*?)\]/);
        const hashMatch = e.content.match(/#[\w]+/g);

        if (tagBlockMatch) {
            tagBlockMatch[1].split(',').forEach(t => {
                const tag = t.trim().toLowerCase();
                tagsCount[tag] = (tagsCount[tag] || 0) + 1;
            });
        }

        if (hashMatch) {
            hashMatch.forEach(t => {
                const tag = t.substring(1).toLowerCase(); // remove #
                tagsCount[tag] = (tagsCount[tag] || 0) + 1;
            });
        }
    });

    const data = Object.keys(tagsCount)
        .map(tag => ({ name: tag, count: tagsCount[tag] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 tags

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No tags or #hashtags found yet.
            </div>
        );
    }

    const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'];

    return (
        <div className="h-48 w-full mt-4">
            <ResponsiveContainer>
                <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        cursor={{ fill: '#F3F4F6' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TopicDistro;
