import FancyLoader from "@/components/fancy-loader"

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[1000] bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <FancyLoader />
    </div>
  )
}
