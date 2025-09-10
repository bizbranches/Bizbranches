import FancyLoader from "@/components/fancy-loader"

export default function LoadingCategory() {
  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 py-12 flex items-center justify-center">
        <FancyLoader />
      </main>
    </div>
  )
}
