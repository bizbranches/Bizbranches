export default function LoadingBusiness() {
  return (
    <div className="w-full px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
          <div className="aspect-video w-full bg-muted animate-pulse rounded" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 w-full bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="h-5 w-32 bg-muted animate-pulse rounded mb-3" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
