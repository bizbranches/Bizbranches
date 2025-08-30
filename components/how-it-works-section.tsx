import { Card, CardContent } from "@/components/ui/card"

const steps = [
  {
    step: "1",
    title: "Search & Discover",
    description: "Use our powerful search to find businesses by name, category, or location across Pakistan.",
    icon: "🔍",
  },
  {
    step: "2",
    title: "Browse & Compare",
    description: "View detailed business profiles, contact information, and services offered.",
    icon: "📋",
  },
  {
    step: "3",
    title: "Connect & Engage",
    description: "Contact businesses directly through phone, WhatsApp, or email to get what you need.",
    icon: "📞",
  },
  {
    step: "4",
    title: "List Your Business",
    description: "Business owner? Add your business to reach thousands of potential customers.",
    icon: "🏢",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Simple steps to find the right business or grow your own business presence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <Card key={step.step} className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
