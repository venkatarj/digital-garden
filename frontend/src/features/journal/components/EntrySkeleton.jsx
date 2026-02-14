import React from 'react';

const EntrySkeleton = () => (
    <div className="p-3 mb-2 rounded-xl bg-white/40 border border-white/20 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200/50 rounded w-3/4" />
                <div className="h-3 bg-slate-200/50 rounded w-1/2" />
            </div>
            <div className="w-8 h-8 bg-slate-200/50 rounded-full ml-4" />
        </div>
    </div>
);

export default EntrySkeleton;
