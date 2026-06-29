import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 5, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl glass-card shadow-sm border border-border/40">
        <div className="w-full">
          {/* Header */}
          <div className="bg-muted/40 border-b border-border/40 flex">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="flex-1 px-5 py-4">
                <Skeleton className="h-4 w-24 bg-muted" />
              </div>
            ))}
          </div>
          {/* Body */}
          <div className="divide-y divide-border/40">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex hover:bg-muted/20 transition-colors">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div key={colIndex} className="flex-1 px-5 py-4 flex items-center">
                    <Skeleton 
                      className={`h-4 bg-muted/60 ${
                        colIndex === 0 ? "w-32" : colIndex === columns - 1 ? "w-16" : "w-24"
                      }`} 
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
