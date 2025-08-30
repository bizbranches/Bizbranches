import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "How do I add my business to Cition?",
    answer:
      'Click on "Add Your Business" button and fill out the simple form with your business details. It\'s completely free to list your business on our platform.',
  },
  {
    question: "Is it free to list my business?",
    answer:
      "Yes, basic business listings are completely free. We also offer premium features for businesses that want enhanced visibility and additional marketing tools.",
  },
  {
    question: "How can customers find my business?",
    answer:
      "Customers can find your business through our search functionality, by browsing categories, or by exploring businesses in their city. We optimize listings for maximum visibility.",
  },
  {
    question: "Can I edit my business information after listing?",
    answer:
      "Yes, you can update your business information at any time. Contact our support team at support@cition.pk for assistance with updates.",
  },
  {
    question: "What information should I include in my business listing?",
    answer:
      "Include your business name, category, complete address, phone number, email, business hours, and a detailed description of your services. High-quality photos also help attract customers.",
  },
  {
    question: "How do I contact businesses listed on Cition?",
    answer:
      "Each business listing includes contact information such as phone numbers, email addresses, and WhatsApp numbers where available. You can reach out directly through your preferred method.",
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about using Cition business directory.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-card rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
