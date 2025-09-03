import { NextResponse, NextRequest } from "next/server"
import { getModels } from "@/lib/models"
import { CreateBusinessSchema, BusinessSchema } from "@/lib/schemas"
import cloudinary from "@/lib/cloudinary"

export const runtime = "nodejs"

// Helper to build a Cloudinary CDN URL from a public_id when logoUrl is missing
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const buildCdnUrl = (publicId?: string | null) => {
  if (!publicId || !process.env.CLOUDINARY_CLOUD_NAME) return undefined
  
  // If it's already a full URL, return as is
  if (publicId.startsWith('http')) return publicId
  
  // Handle Cloudinary public_id format (may include path or extension)
  // Remove any Cloudinary URL prefix if present
  let cleanId = publicId
    .replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//, '') // Remove full URL prefix
    .replace(/^.*\//, '') // Remove any path
    .replace(/\.[^/.]+$/, '') // Remove file extension
    
  // If it looks like a Cloudinary public_id (no slashes, no dots except possibly at extension)
  if (!cleanId.includes('/') && !cleanId.startsWith('.')) {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fit,w_200,h_200,q_auto,f_auto/${cleanId}`
  }
  
  return undefined
}

async function uploadToCloudinary(file: File): Promise<{ url: string; public_id: string } | null> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "cition/business-logos",
          resource_type: "image",
          transformation: [{ quality: "auto", fetch_format: "auto", width: 200, height: 200, crop: "fit" }],
        },
        (error, result) => {
          if (error || !result) return reject(error)
          resolve({ url: result.secure_url, public_id: result.public_id })
        },
      )
      stream.end(buffer)
    })
  } catch (e) {
    return null
  }

}

// Admin: approve or reject a business
// Auth: send header "x-admin-secret" or Bearer token matching process.env.ADMIN_SECRET
export async function PATCH(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) {
      return NextResponse.json({ ok: false, error: "Missing ADMIN_SECRET" }, { status: 500 })
    }

    const bearer = req.headers.get("authorization") || ""
    const headerSecret = req.headers.get("x-admin-secret") || (bearer.startsWith("Bearer ") ? bearer.slice(7) : "")
    if (headerSecret !== adminSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as { id?: string; status?: string }
    const id = body.id?.trim()
    const nextStatus = body.status?.trim() as "approved" | "pending" | "rejected" | undefined
    if (!id || !nextStatus || !["approved", "pending", "rejected"].includes(nextStatus)) {
      return NextResponse.json({ ok: false, error: "id and valid status are required" }, { status: 400 })
    }

    const { ObjectId } = require("mongodb") as typeof import("mongodb")
    const models = await getModels()
    const result = await models.businesses.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: nextStatus, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, modifiedCount: result.modifiedCount })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to update status" }, { status: 500 })
  }
}

// GET endpoint for retrieving businesses
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')
    const province = searchParams.get('province')
    const city = searchParams.get('city')
    const area = searchParams.get('area')
    const status = searchParams.get('status')
    const q = searchParams.get('q')
    const slug = searchParams.get('slug')
    const subCategoryParam = searchParams.get('subcategory') || searchParams.get('subCategory')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    console.log('GET /api/business - Query params:', { id, slug, category, subCategory: subCategoryParam, province, city, area, status, q, page, limit })

    const models = await getModels()
    
    // If requesting a single business by slug
    if (slug) {
      const business = await models.businesses.findOne({ slug })
      if (!business) {
        return NextResponse.json(
          { ok: false, error: 'Business not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        ok: true,
        business: {
          ...business,
          // Derive a logo URL if missing but we have a public id or a non-URL 'logo' value
          logoUrl:
            business.logoUrl ||
            buildCdnUrl((business as any).logoPublicId) ||
            (/^https?:\/\//i.test((business as any).logo || '') ? undefined : buildCdnUrl((business as any).logo)),
          id: business._id.toString(),
        }
      })
    }

    // If requesting a single business by ID
    if (id) {
      let business = null
      try {
        const objectId = new (require('mongodb')).ObjectId(id)
        business = await models.businesses.findOne({ _id: objectId })
      } catch {
        // id might actually be a slug string passed as id; try slug lookup
        business = await models.businesses.findOne({ slug: id })
      }
      if (!business) {
        return NextResponse.json(
          { ok: false, error: 'Business not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        ok: true,
        business: {
          ...business,
          logoUrl:
            business.logoUrl ||
            buildCdnUrl((business as any).logoPublicId) ||
            (/^https?:\/\//i.test((business as any).logo || '') ? undefined : buildCdnUrl((business as any).logo)),
          id: business._id.toString(),
        }
      })
    }
    
    // Build filter object for multiple businesses
    const filter: any = {}
    if (category) {
      // Accept both exact and case-insensitive variants of the slug as stored category names may differ in casing/spaces
      // e.g., 'beauty-salon' vs 'Beauty & Salon' in DB
      const categoryRegex = new RegExp(category.replace(/-/g, "[\\s&]*"), 'i')
      filter.$or = [...(filter.$or || []), { category }, { category: categoryRegex }]
    }
    if (subCategoryParam) {
      const subcatRegex = new RegExp(subCategoryParam.replace(/-/g, "[\\s&]*"), 'i')
      filter.$or = [...(filter.$or || []), { subCategory: subCategoryParam }, { subCategory: subcatRegex }]
    }
    if (province) filter.province = province
    if (city) filter.city = city
    if (area) filter.area = area
    if (status) {
      if (status === 'all') {
        // no status filter; include all statuses
      } else if (status.includes(',')) {
        filter.status = { $in: status.split(',').map(s => s.trim()).filter(Boolean) }
      } else {
        filter.status = status
      }
    } else {
      // By default, list only approved businesses on the public/main site
      // Admin can pass ?status=pending or ?status=all (handled client-side) as needed
      filter.status = "approved"
    }
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i')
      filter.$or = [
        ...(filter.$or || []),
        { name: regex },
        { description: regex },
        { category: regex },
        { province: regex },
        { city: regex },
        { area: regex },
      ]
    }

    // Build a projection to reduce payload size for list views
    const projection = {
      name: 1,
      slug: 1,
      category: 1,
      subCategory: 1,
      province: 1,
      city: 1,
      area: 1,
      address: 1,
      description: 1,
      logo: 1,
      logoUrl: 1,
      logoPublicId: 1,
      imageUrl: 1,
      phone: 1,
      email: 1,
      websiteUrl: 1,
      facebookUrl: 1,
      gmbUrl: 1,
      youtubeUrl: 1,
      status: 1,
      createdAt: 1,
    } as const

    const skip = (page - 1) * limit
    
    const businesses = await models.businesses.find(filter, { projection })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await models.businesses.countDocuments(filter)

    // Lightweight log
    console.log(`Found ${businesses.length} businesses, total: ${total}`)

    // Add id field for each business
    const businessesWithId = businesses.map(business => ({
      ...business,
      // If logoUrl missing but public id or 'logo' public_id is present, derive a CDN URL
      logoUrl:
        (business as any).logoUrl ||
        buildCdnUrl((business as any).logoPublicId) ||
        (/^https?:\/\//i.test((business as any).logo || '') ? undefined : buildCdnUrl((business as any).logo)),
      id: (business as any)._id?.toString?.() || business._id.toString(),
    }))

    return NextResponse.json({
      ok: true,
      businesses: businessesWithId,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch businesses' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    // Extract form data
    const formData = {
      name: String(form.get("name") || "").trim(),
      category: String(form.get("category") || "").trim(),
      subCategory: String(form.get("subCategory") || form.get("subcategory") || "").trim(),
      province: String(form.get("province") || "").trim(),
      city: String(form.get("city") || "").trim(),
      address: String(form.get("address") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      contactPerson: String(form.get("contactPerson") || "").trim() || "",
      whatsapp: String(form.get("whatsapp") || "").trim() || "",
      email: String(form.get("email") || "").trim(),
      description: String(form.get("description") || "").trim(),
      websiteUrl: String(form.get("websiteUrl") || "").trim(),
      facebookUrl: String(form.get("facebookUrl") || "").trim(),
      gmbUrl: String(form.get("gmbUrl") || "").trim(),
      youtubeUrl: String(form.get("youtubeUrl") || "").trim(),
    }

    console.log("Raw form data received:", formData)
    console.log("Form data keys:", Object.keys(formData))
    console.log("Form data values:", Object.values(formData))

    // Validate using Zod schema
    const validationResult = CreateBusinessSchema.safeParse(formData)
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.errors)
      console.error("Each validation error:")
      validationResult.error.errors.forEach((err, index) => {
        console.error(`Error ${index + 1}:`, {
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        })
      })
      return NextResponse.json(
        { 
          ok: false, 
          error: "Validation failed", 
          details: validationResult.error.errors,
          receivedData: formData
        }, 
        { status: 400 }
      )
    }

    const validatedData = validationResult.data
    const logo = form.get("logo") as File | null

    let logoUrl: string | undefined
    let logoPublicId: string | undefined

    // Handle logo upload to Cloudinary
    if (logo && typeof logo === "object" && logo.size > 0) {
      const uploaded = await uploadToCloudinary(logo)
      if (uploaded) {
        logoUrl = uploaded.url
        logoPublicId = uploaded.public_id
      }
    }

    // Get database models
    const models = await getModels()

    // Generate unique slug from name
    const baseSlug = String(validatedData.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120)
    let uniqueSlug = baseSlug || `business-${Date.now()}`
    let attempt = 0
    while (await models.businesses.findOne({ slug: uniqueSlug })) {
      attempt += 1
      uniqueSlug = `${baseSlug}-${attempt}`
    }

    // Create business document with schema validation
    const businessDoc = BusinessSchema.parse({
      ...validatedData,
      slug: uniqueSlug,
      logoUrl: logoUrl || undefined,
      logoPublicId: logoPublicId || undefined,
      status: "pending" as const,
      createdAt: new Date(),
    })

    // Insert into database
    const result = await models.businesses.insertOne(businessDoc)

    // Update category count
    await models.categories.updateOne(
      { slug: validatedData.category },
      { $inc: { count: 1 } }
    )

    return NextResponse.json(
      { 
        ok: true, 
        id: result.insertedId, 
        business: { ...businessDoc, _id: result.insertedId } 
      }, 
      { status: 201 }
    )
  } catch (err: any) {
    console.error("Business creation error:", err)
    return NextResponse.json(
      { 
        ok: false, 
        error: err?.message || "Internal server error" 
      }, 
      { status: 500 }
    )
  }
}
