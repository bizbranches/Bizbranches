export default function LoadingCategory() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-9 w-60 bg-muted animate-pulse rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border overflow-hidden">
            <div className="aspect-[16/9] w-full bg-muted animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-40 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
