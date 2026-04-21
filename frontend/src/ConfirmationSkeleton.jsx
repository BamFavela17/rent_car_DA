import React from 'react';

const ConfirmationSkeleton = () => (
  <div className="overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse">
    <div className="h-32 bg-slate-100 relative">
      <div className="absolute top-2 right-2 h-4 w-12 bg-slate-200 rounded-full" />
    </div>
    <div className="p-5 space-y-4">
      <div className="space-y-2">
        <div className="h-2 w-24 bg-slate-100 rounded-full" />
        <div className="h-5 w-48 bg-slate-200 rounded-lg" />
        <div className="h-3 w-32 bg-slate-100 rounded-full" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
        <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
      </div>
    </div>
  </div>
);

export default ConfirmationSkeleton;