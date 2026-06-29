import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-3xl glass-card p-6 shadow-sm border border-border/40">
          <div className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24 bg-muted" />
            <Skeleton className="h-4 w-4 rounded-full bg-muted" />
          </div>
          <div>
            <Skeleton className="h-8 w-28 bg-muted mb-1" />
            <Skeleton className="h-3 w-32 bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardChartSkeleton() {
  return (
    <div className="rounded-3xl glass-card p-6 shadow-sm border border-border/40 flex flex-col h-[400px]">
      <div className="flex flex-col space-y-1.5 pb-4">
        <Skeleton className="h-6 w-48 bg-muted" />
        <Skeleton className="h-4 w-64 bg-muted/60" />
      </div>
      <div className="flex-1 w-full bg-muted/10 rounded-xl flex items-end justify-between px-4 pb-4 pt-10 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="w-full bg-muted/40 rounded-t-sm" 
            style={{ height: `${Math.max(20, Math.random() * 100)}%` }} 
          />
        ))}
      </div>
    </div>
  );
}
