import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="min-h-screen flex w-full bg-zinc-950 overflow-hidden">
      {/* Left Sidebar Skeleton */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col shrink-0">
        <div className="p-5 flex items-center justify-center">
          <Skeleton className="h-24 w-24 rounded-lg" />
        </div>
        <div className="h-px bg-zinc-800" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="h-px bg-zinc-800 my-2" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-900 shrink-0 p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="h-px bg-zinc-800" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="h-px bg-zinc-800" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function MotosPageSkeleton() {
  return (
    <div className="min-h-screen flex w-full bg-zinc-950 overflow-hidden">
      {/* Left Sidebar Skeleton */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col shrink-0">
        <div className="p-5 flex items-center justify-center">
          <Skeleton className="h-24 w-24 rounded-lg" />
        </div>
        <div className="h-px bg-zinc-800" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>

          {/* Moto cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-32 w-full rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-full rounded-lg" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-900 shrink-0 p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="h-px bg-zinc-800" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProfilPageSkeleton() {
  return (
    <div className="min-h-screen flex w-full bg-zinc-950 overflow-hidden">
      {/* Left Sidebar Skeleton */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col shrink-0">
        <div className="p-5 flex items-center justify-center">
          <Skeleton className="h-24 w-24 rounded-lg" />
        </div>
        <div className="h-px bg-zinc-800" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Profile header */}
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>

          {/* Content tabs */}
          <Skeleton className="h-10 w-72 rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-900 shrink-0 p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="h-px bg-zinc-800" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ConfigsPageSkeleton() {
  return (
    <div className="min-h-screen flex w-full bg-zinc-950 overflow-hidden">
      {/* Left Sidebar Skeleton */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col shrink-0">
        <div className="p-5 flex items-center justify-center">
          <Skeleton className="h-24 w-24 rounded-lg" />
        </div>
        <div className="h-px bg-zinc-800" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>

          {/* Config cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-900 shrink-0 p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="h-px bg-zinc-800" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ChatPageSkeleton() {
  return (
    <div className="min-h-screen flex w-full bg-zinc-950 overflow-hidden">
      {/* Left Sidebar Skeleton */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col shrink-0">
        <div className="p-5 flex items-center justify-center">
          <Skeleton className="h-24 w-24 rounded-lg" />
        </div>
        <div className="h-px bg-zinc-800" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Main Content - Chat area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          {/* Messages area */}
          <div className="flex-1 p-6 space-y-4 overflow-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] space-y-2 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                  <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-64'} rounded-xl`} />
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="border-t border-zinc-800 p-4">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-900 shrink-0 p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="h-px bg-zinc-800" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
