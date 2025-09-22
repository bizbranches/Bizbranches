"use client"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">Contact</h1>

        <p className="text-foreground/90 leading-relaxed mb-2 font-semibold">For Business Listing and Inquiries</p>
        <p className="text-muted-foreground mb-6">Send us a message below or email us at</p>
        <div className="space-y-1 mb-10">
          <a href="mailto:digitalskillshouse@gmail.com" className="text-primary underline block">digitalskillshouse@gmail.com</a>
          <a href="mailto:support@bizbranches.pk" className="text-primary underline block">support@bizbranches.pk</a>
        </div>
      </div>
    </main>
  )
}
