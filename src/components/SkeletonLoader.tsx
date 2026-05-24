import React from 'react';

const Shimmer = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg ${className ?? ''}`} />
);

export function AppBootSkeleton() {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex">
      {/* sidebar stub */}
      <div className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 gap-3 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 animate-pulse" />
          <Shimmer className="h-4 w-28 bg-slate-700" />
        </div>
        {[...Array(5)].map((_, i) => (
          <Shimmer key={i} className="h-10 w-full bg-slate-800" />
        ))}
      </div>

      {/* content */}
      <div className="flex-1 flex justify-center lg:justify-start">
        <div className="w-full max-w-[430px] mx-auto lg:max-w-none bg-white dark:bg-slate-950 min-h-screen flex flex-col">
          {/* mobile header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 animate-pulse" />
              <Shimmer className="h-4 w-24" />
            </div>
            <Shimmer className="h-8 w-8 rounded-xl" />
          </div>

          <div className="p-4 flex flex-col gap-4">
            {/* stat cards row */}
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-2">
                  <Shimmer className="h-3 w-16" />
                  <Shimmer className="h-6 w-24" />
                  <Shimmer className="h-3 w-12" />
                </div>
              ))}
            </div>

            {/* chart area */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-3">
              <Shimmer className="h-4 w-32" />
              <Shimmer className="h-36 w-full rounded-xl" />
            </div>

            {/* list rows */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-3">
              <Shimmer className="h-4 w-28 mb-1" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Shimmer className="w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Shimmer className="h-3 w-32" />
                    <Shimmer className="h-3 w-20" />
                  </div>
                  <Shimmer className="h-4 w-16 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContentSkeleton({ view }: { view?: string }) {
  if (view === 'customers-list' || view === 'inventory-list' || view === 'money-tracking') {
    return (
      <div className="p-4 flex flex-col gap-4">
        {/* search bar */}
        <Shimmer className="h-11 w-full rounded-2xl" />
        {/* rows */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-1">
            <Shimmer className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Shimmer className="h-3.5 w-36" />
              <Shimmer className="h-3 w-24" />
            </div>
            <Shimmer className="h-4 w-14 shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (view === 'analytics') {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-2">
              <Shimmer className="h-3 w-16" />
              <Shimmer className="h-6 w-20" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-3">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="h-48 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-3">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // dashboard default
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-2">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-6 w-24" />
            <Shimmer className="h-3 w-12" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col gap-3">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-36 w-full rounded-xl" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-1">
          <Shimmer className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Shimmer className="h-3.5 w-32" />
            <Shimmer className="h-3 w-20" />
          </div>
          <Shimmer className="h-4 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
