import { NextRequest, NextResponse } from "next/server"
import { getModels } from "@/lib/models"

// Fallback subcategories by category slug (used when DB has none)
const DEFAULT_SUBCATEGORIES: Record<string, Array<{ name: string; slug: string }>> = {
  "beauty-salon": [
    { name: "Hair Care", slug: "hair-care" },
    { name: "Makeup", slug: "makeup" },
    { name: "Skin Care", slug: "skin-care" },
    { name: "Nail Salon", slug: "nail-salon" },
    { name: "Spa", slug: "spa" },
  ],
  "automotive": [
    { name: "Car Repair", slug: "car-repair" },
    { name: "Car Wash", slug: "car-wash" },
    { name: "Tyres & Wheels", slug: "tyres-wheels" },
    { name: "Car Accessories", slug: "car-accessories" },
    { name: "Showroom", slug: "showroom" },
  ],
  "restaurants": [
    { name: "Fast Food", slug: "fast-food" },
    { name: "BBQ", slug: "bbq" },
    { name: "Pakistani", slug: "pakistani" },
    { name: "Chinese", slug: "chinese" },
    { name: "Cafe", slug: "cafe" },
  ],
  "healthcare": [
    { name: "Clinic", slug: "clinic" },
    { name: "Hospital", slug: "hospital" },
    { name: "Pharmacy", slug: "pharmacy" },
    { name: "Dentist", slug: "dentist" },
    { name: "Laboratory", slug: "laboratory" },
  ],
  "education": [
    { name: "School", slug: "school" },
    { name: "College", slug: "college" },
    { name: "University", slug: "university" },
    { name: "Coaching", slug: "coaching" },
    { name: "Training Center", slug: "training-center" },
  ],
  "shopping": [
    { name: "Clothing", slug: "clothing" },
    { name: "Electronics", slug: "electronics" },
    { name: "Groceries", slug: "groceries" },
    { name: "Footwear", slug: "footwear" },
    { name: "Jewelry", slug: "jewelry" },
  ],
}

export const runtime = "nodejs"
// Cache this route for 1 hour with ISR semantics
export const revalidate = 3600

// GET /api/categories?q=rest
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""
    const slug = searchParams.get("slug")?.trim() || ""
    const limit = parseInt(searchParams.get("limit") || "10")
    const safeLimit = Math.min(Math.max(limit, 1), 60)

    const models = await getModels()

    // If a specific category is requested by slug, return it (with subcategories if present or defaulted)
    if (slug) {
      const category = await models.categories.findOne(
        { slug, isActive: { $ne: false } },
        { projection: { _id: 0, name: 1, slug: 1, count: 1, imageUrl: 1, icon: 1, subcategories: 1 } }
      )
      if (!category) {
        return NextResponse.json({ ok: false, error: "Category not found" }, { status: 404 })
      }
      if (!Array.isArray((category as any).subcategories) || (category as any).subcategories.length === 0) {
        ;(category as any).subcategories = DEFAULT_SUBCATEGORIES[category.slug] || []
      }
      const res = NextResponse.json({ ok: true, category })
      res.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400")
      return res
    }

    // Otherwise, return a list of categories (optionally filtered by q)
    const filter: any = { isActive: { $ne: false } }
    if (q) {
      const regex = new RegExp(q, "i")
      filter.$or = [{ name: regex }, { slug: regex }]
    }

    const categories = await models.categories
      .find(filter, { projection: { _id: 0, name: 1, slug: 1, count: 1, imageUrl: 1, icon: 1, subcategories: 1 } })
      .sort({ count: -1, name: 1 })
      .limit(safeLimit)
      .toArray()

    // Apply default subcategories if missing
    const enriched = categories.map((c: any) => {
      if (!Array.isArray(c.subcategories) || c.subcategories.length === 0) {
        c.subcategories = DEFAULT_SUBCATEGORIES[c.slug] || []
      }
      return c
    })

    const res = NextResponse.json({ ok: true, categories: enriched })
    res.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400")
    return res
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ ok: false, error: "Failed to fetch businesses" }, { status: 500 })
  }
}
