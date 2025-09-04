import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail } from "lucide-react"
import Link from "next/link"

interface Business {
  id: string
  slug?: string
  name: string
  category: string
  city?: string
  address?: string
  phone?: string
  whatsapp?: string
  email?: string
  description?: string
  logo?: string
  logoUrl?: string
  status?: "pending" | "approved" | "rejected"
}

interface Props {
  business: Business
  compact?: boolean
}

export default function BusinessListItem({ business, compact = false }: Props) {
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
        {/* Logo */}
        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
          <img
            src={
              (business.logoUrl || business.logo)
                ? (() => {
                    const raw = business.logoUrl || business.logo || ''
                    if (/^https?:\/\//i.test(raw)) return raw
                    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
                    if (!cloudName) return "/bank-branch.png"
                    // Support folder paths and strip extension
                    const cleanId = String(raw).replace(/\.[^/.]+$/, '')
                    return `https://res.cloudinary.com/${cloudName}/image/upload/c_fit,w_200,h_200,q_auto,f_auto/${cleanId}`
                  })()
                : "/bank-branch.png"
            }
            alt={`${business.name} logo`}
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = "/bank-branch.png" }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-base text-foreground leading-6 truncate">
              {business.name}
            </h3>
            {business.status === "pending" && (
              <span className="inline-flex items-center rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                Pending
              </span>
            )}
          </div>

          <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-medium">
              {business.category}
            </span>
            {business.city && (
              <span className="inline-flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {business.city}
              </span>
            )}
            {business.address && (
              <span className="max-w-full sm:max-w-[420px] md:max-w-[560px] truncate">
                {business.address}
              </span>
            )}
          </div>

          {!compact && business.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {business.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-2 sm:items-end items-start">
          {!compact && business.phone && (
            <Button size="sm" variant="outline" asChild>
              <a href={`tel:${business.phone}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}
          {!compact && business.email && (
            <Button size="sm" variant="outline" asChild>
              <a href={`mailto:${business.email}`}>
                <Mail className="h-4 w-4" />
              </a>
            </Button>
          )}
          {business.status && business.status !== "approved" ? (
            <Button size="sm" variant="outline" disabled title="Awaiting admin approval">
              Pending Approval
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href={`/business/${business.slug || business.id}`}>View details</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
