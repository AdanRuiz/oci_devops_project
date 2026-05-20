/**
 * Pulse skeleton blocks for dashboard routes (Tailwind animate-pulse).
 */

function Bar({ className = '', style }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#2A1814]/[0.07] ${className}`}
      style={style}
      aria-hidden
    />
  );
}

export function DashboardHomeSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid min-h-0 flex-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-12">
        <div className="flex min-h-0 flex-col gap-10">
          <section>
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-[#2A1814]/[0.08] pb-3">
              <div className="space-y-2">
                <Bar className="h-4 w-48" />
                <Bar className="h-3 w-64" />
              </div>
            </div>
            <div className="h-52 rounded-xl bg-[#2A1814]/[0.04] p-4 ring-1 ring-[#2A1814]/[0.06] sm:h-60">
              <Bar className="mb-4 h-3 max-w-[12rem]" />
              <div className="flex h-[calc(100%-2rem)] items-end gap-2 pt-4">
                {[40, 55, 48, 70, 52, 35].map((h, i) => (
                  <Bar key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-[#2A1814]/[0.08] pb-3">
              <div className="space-y-2">
                <Bar className="h-4 w-56" />
                <Bar className="h-3 max-w-[18rem]" />
              </div>
            </div>
            <div className="min-h-[10rem] flex-1 space-y-3 rounded-xl bg-[#2A1814]/[0.04] p-4 ring-1 ring-[#2A1814]/[0.06]">
              {[72, 58, 45, 88, 40, 65].map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Bar className="h-3 w-20 shrink-0" />
                  <Bar className="h-4 flex-1 rounded-full" style={{ maxWidth: `${w}%` }} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="flex min-h-0 flex-col lg:border-l lg:border-[#2A1814]/[0.08] lg:pl-10">
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-[#2A1814]/[0.08] pb-3">
            <Bar className="h-4 w-24" />
            <Bar className="h-6 w-14 rounded-full" />
          </div>
          <div className="min-h-0 flex-1 space-y-0 divide-y divide-[#2A1814]/[0.06]">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-3 py-4">
                <Bar className="mt-0.5 h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Bar className="h-3.5 max-w-[14rem]" />
                  <Bar className="h-3 max-w-[11rem]" />
                  <Bar className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex shrink-0 justify-center border-t border-[#2A1814]/[0.06] pt-4">
            <Bar className="h-10 w-28 rounded-full" />
          </div>
        </section>
      </div>
    </div>
  );
}

export function DashboardProjectsSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading projects">
      <div>
        <Bar className="h-6 w-36" />
        <Bar className="mt-3 h-4 max-w-md" />
      </div>

      <div className="flex flex-col border-y border-[#2A1814]/[0.08] sm:flex-row sm:items-stretch">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex min-w-0 flex-1 items-center gap-4 px-2 py-5 sm:px-4 sm:py-6"
          >
            <Bar className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bar className="h-3.5 w-24" />
              <Bar className="h-8 w-16" />
              <Bar className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        <div className="border-b border-[#2A1814]/[0.08] pb-3">
          <div className="flex items-baseline justify-between gap-4">
            <Bar className="h-4 w-36" />
            <Bar className="h-3 w-24" />
          </div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between ${
              i < 4 ? 'border-b border-[#2A1814]/[0.06]' : ''
            }`}
          >
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <Bar className="mt-0.5 h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-3">
                <Bar className="h-4 max-w-[12rem]" />
                <div className="flex flex-wrap gap-2">
                  <Bar className="h-3 w-20" />
                  <Bar className="h-3 w-16" />
                  <Bar className="h-3 w-14" />
                </div>
                <div className="flex gap-2">
                  <Bar className="h-7 w-7 rounded-full" />
                  <Bar className="h-7 w-7 rounded-full" />
                  <Bar className="h-7 w-7 rounded-full" />
                  <Bar className="h-3 w-24 self-center" />
                </div>
              </div>
            </div>
            <Bar className="h-4 w-16 shrink-0 self-start sm:self-center" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardProjectShellSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading project">
      <div>
        <Bar className="h-4 w-28" />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Bar className="h-8 max-w-[14rem]" />
            <Bar className="h-4 max-w-[20rem]" />
          </div>
          <Bar className="h-3 w-40" />
        </div>
      </div>

      <div className="border-b border-[#2A1814]/[0.08] pb-4">
        <Bar className="mb-3 h-3 w-20" />
        <div className="flex flex-wrap gap-2">
          <Bar className="h-9 w-24 rounded-full" />
          <Bar className="h-9 w-28 rounded-full" />
          <Bar className="h-9 w-32 rounded-full" />
          <Bar className="h-9 w-24 rounded-full" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#2A1814]/[0.06] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 space-y-2 border-b border-[#2A1814]/[0.08] pb-3">
              <Bar className="h-4 w-44" />
              <Bar className="h-3 max-w-xs" />
            </div>
            <div className="h-56 rounded-xl bg-[#2A1814]/[0.04] ring-1 ring-[#2A1814]/[0.05]">
              <svg className="h-full w-full p-6" preserveAspectRatio="none" aria-hidden>
                <path
                  d="M 0 80 Q 80 20 160 60 T 320 40 T 480 70 L 480 200 L 0 200 Z"
                  className="fill-[#2A1814]/[0.06]"
                />
                <path
                  d="M 0 90 Q 100 40 200 70 T 400 50 L 400 200 L 0 200 Z"
                  className="fill-[#2A1814]/[0.04]"
                />
              </svg>
            </div>
          </div>
          <div className="rounded-2xl border border-[#2A1814]/[0.06] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 space-y-2 border-b border-[#2A1814]/[0.08] pb-3">
              <Bar className="h-4 w-40" />
              <Bar className="h-3 w-56" />
            </div>
            <div className="flex flex-col items-center pt-2">
              <Bar className="mb-3 h-7 w-16 rounded-full" />
              <Bar className="mx-auto h-44 w-44 rounded-full" />
              <div className="mt-4 flex w-full justify-center gap-4">
                <Bar className="h-3 w-16" />
                <Bar className="h-3 w-20" />
                <Bar className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[#2A1814]/[0.06] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 space-y-2 border-b border-[#2A1814]/[0.08] pb-3">
            <Bar className="h-4 w-48" />
            <Bar className="h-3 w-64" />
          </div>
          <div className="h-56 rounded-xl bg-[#2A1814]/[0.04] ring-1 ring-[#2A1814]/[0.05]" />
        </div>
      </div>
    </div>
  );
}

export function DashboardListViewSkeleton({ title = 'Loading…', showFilters = true }) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label={title}>
      <div>
        <Bar className="h-6 w-32" />
        <Bar className="mt-2 h-4 max-w-md" />
      </div>

      <div className="flex flex-col border-y border-[#2A1814]/[0.08] sm:flex-row sm:items-stretch">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex min-w-0 flex-1 items-center gap-4 px-2 py-5 sm:px-4 sm:py-6">
            <Bar className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bar className="h-3.5 w-24" />
              <Bar className="h-8 w-16" />
              <Bar className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>

      {showFilters ? (
        <div className="flex flex-wrap gap-3">
          <Bar className="h-10 min-w-[240px] flex-1 rounded-xl" />
          <Bar className="h-10 w-44 rounded-xl" />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#2A1814]/[0.06] bg-white shadow-sm">
        <div className="border-b border-[#2A1814]/[0.06] px-4 py-3">
          <Bar className="h-4 w-28" />
        </div>
        <div className="space-y-0 divide-y divide-[#2A1814]/[0.06] p-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-4">
              <Bar className="h-9 w-9 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bar className="h-3.5 max-w-[16rem]" />
                <Bar className="h-3 max-w-[12rem]" />
              </div>
              <Bar className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
