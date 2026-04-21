import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm animate-pulse">
      <div className="h-64 bg-slate-100 relative overflow-hidden">
        {/* Placeholder for image and price badge */}
        <div className="absolute top-6 right-6 bg-slate-200/95 backdrop-blur px-5 py-2.5 rounded-2xl w-24 h-10"></div>
      </div>
      <div className="p-8 space-y-6">
        <div>
          {/* Placeholder for type and year */}
          <div className="flex justify-between items-center mb-2">
            <div className="h-4 w-20 bg-slate-200 rounded-full"></div>
            <div className="h-4 w-12 bg-slate-200 rounded-full"></div>
          </div>
          {/* Placeholder for brand and model */}
          <div className="h-8 w-3/4 bg-slate-200 rounded-lg"></div>
        </div>
        
        {/* Placeholder for features */}
        <div className="grid grid-cols-2 gap-4 py-5 border-y border-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 rounded-xl h-10 w-10"></div>
            <div className="h-4 w-24 bg-slate-200 rounded-full"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 rounded-xl h-10 w-10"></div>
            <div className="h-4 w-24 bg-slate-200 rounded-full"></div>
          </div>
        </div>

        {/* Placeholder for button */}
        <div className="w-full bg-slate-200 py-5 rounded-2xl h-16"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;