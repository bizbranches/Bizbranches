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

  // Normalize possible full Cloudinary-style path to extract the public_id including folders
  // Example inputs we support:
  // - my_folder/asset_name
  // - my_folder/asset_name.png
  // - https://res.cloudinary.com/<cloud>/image/upload/v123/my_folder/asset_name.png
  let cleanId = publicId
    .replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v?\d+\//, '') // strip host + delivery + optional version
    .replace(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//, '') // strip host + delivery (no version)

  // Remove file extension, Cloudinary works without it for transformation URLs
  cleanId = cleanId.replace(/\.[^/.]+$/, '')

  // Do not strip folder paths; keep them intact
  // Generate a resized, auto-format URL
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_fit,w_200,h_200,q_auto,f_auto/${cleanId}`
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
          if (error || !result) {
            console.error("Cloudinary upload_stream error:", error)
            return reject(error)
          }
          resolve({ url: result.secure_url, public_id: result.public_id })
        },
      )
      stream.end(buffer)
    })
  } catch (e) {
    console.error("uploadToCloudinary failed:", e)
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
    const after = searchParams.get('after') // optional cursor (ISO date)
    const searchMode = (searchParams.get('searchMode') || '').toLowerCase()
    const suggest = searchParams.get('suggest') === '1'

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
    
    // Build filter with AND semantics; each field can have its own $or for fuzzy matching
    const andConds: any[] = []
    if (category) {
      // Accept both exact and case-insensitive variants of the slug as stored category names may differ in casing/spaces
      // e.g., 'beauty-salon' vs 'Beauty & Salon' in DB
      const categoryRegex = new RegExp(category.replace(/-/g, "[\\s&]*"), 'i')
      andConds.push({ $or: [{ category }, { category: categoryRegex }] })
    }
    if (subCategoryParam) {
      const subcatRegex = new RegExp(subCategoryParam.replace(/-/g, "[\\s&]*"), 'i')
      andConds.push({ $or: [{ subCategory: subCategoryParam }, { subCategory: subcatRegex }] })
    }
    if (province) andConds.push({ province })
    if (city) {
      // Accept exact slug, case-insensitive name, and hyphen/space interchangeable variants
      // e.g., 'rahim-yar-khan' should match 'Rahim Yar Khan'
      const normalized = city.trim()
      const cityRegex = new RegExp(`^${normalized.replace(/-/g, "[\\s-]")}$`, 'i')
      andConds.push({ $or: [{ city: normalized }, { city: cityRegex }] })
    }
    if (area) andConds.push({ area })
    if (status) {
      if (status === 'all') {
        // no status filter; include all statuses
      } else if (status.includes(',')) {
        andConds.push({ status: { $in: status.split(',').map(s => s.trim()).filter(Boolean) } })
      } else {
        andConds.push({ status })
      }
    } else {
      // By default, list only approved businesses on the public/main site
      andConds.push({ status: "approved" })
    }
    if (q && q.trim()) {
      if (searchMode === 'regex') {
        const regex = new RegExp(q.trim(), 'i')
        andConds.push({
          $or: [
            { name: regex },
            { description: regex },
            { category: regex },
            { province: regex },
            { city: regex },
            { area: regex },
          ]
        })
      } else {
        // Default: use indexed text search (see indexes in lib/models.ts)
        andConds.push({ $text: { $search: q.trim() } })
      }
    }

    const filter: any = andConds.length === 0 ? {} : (andConds.length === 1 ? andConds[0] : { $and: andConds })

    // Build a projection to reduce payload size for list views
    const projection: any = {
      name: 1,
      slug: 1,
      category: 1,
      subCategory: 1,
      province: 1,
      city: 1,
      postalCode: 1,
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
      // Bank fields
      swiftCode: 1,
      branchCode: 1,
      cityDialingCode: 1,
      iban: 1,
      status: 1,
      createdAt: 1,
    } as const
    if (q && q.trim() && searchMode !== 'regex') {
      ;(projection as any).score = { $meta: 'textScore' }
    }

    // Choose sort order
    let sort: any = { createdAt: -1 }
    if (q && q.trim() && searchMode !== 'regex') {
      sort = { score: { $meta: 'textScore' }, createdAt: -1 }
    }

    // Support cursor pagination via ?after=ISO, else fallback to page/limit
    let cursorFilter = { ...filter }
    if (after) {
      try {
        const afterDate = new Date(after)
        if (!Number.isNaN(afterDate.getTime())) {
          ;(cursorFilter as any).createdAt = { ...(cursorFilter as any).createdAt, $lt: afterDate }
        }
      } catch {}
    }

    const skip = after ? 0 : (page - 1) * limit
    let businesses: any[] = []

    if (suggest && q && q.trim()) {
      // Suggestion mode: prefer name prefix matches, then contains
      const qVal = q.trim()
      const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const prefix = new RegExp(`^${esc(qVal)}`, 'i')
      const contains = new RegExp(esc(qVal), 'i')
      const matchStage = { $match: cursorFilter }
      const addFields = {
        $addFields: {
          prefixMatch: { $cond: [{ $regexMatch: { input: "$name", regex: prefix } }, 1, 0] },
          containsMatch: { $cond: [{ $regexMatch: { input: "$name", regex: contains } }, 1, 0] },
        }
      }
      const pipeline = [
        matchStage,
        addFields as any,
        { $sort: { prefixMatch: -1, containsMatch: -1, createdAt: -1, name: 1 } },
        { $project: projection },
        { $skip: skip },
        { $limit: limit }
      ]
      businesses = await models.businesses.aggregate(pipeline).toArray()
    } else {
      businesses = await models.businesses.find(cursorFilter, { projection })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray()
    }

    // Exact total can be expensive; keep existing behavior but you can disable by passing count=0
    const countParam = searchParams.get('count')
    const wantCount = countParam !== '0'
    const total = suggest ? undefined : (wantCount ? await models.businesses.countDocuments(filter) : undefined)

    // Lightweight log
    console.log(`Found ${businesses.length} businesses, total: ${total}`)

    // Add id field for each business, skip malformed docs instead of failing whole response
    let skipped = 0
    const businessesWithId = businesses.reduce((acc: any[], b: any) => {
      try {
        const rawId = b?._id
        const safeId = rawId ? String(rawId) : (b?.slug || b?.id || "")
        acc.push({
          ...b,
          // If logoUrl missing but public id or 'logo' public_id is present, derive a CDN URL
          logoUrl:
            b?.logoUrl ||
            buildCdnUrl(b?.logoPublicId) ||
            (/^https?:\/\//i.test(b?.logo || '') ? undefined : buildCdnUrl(b?.logo)),
          id: safeId,
        })
      } catch (e: any) {
        skipped += 1
        console.warn('Skipping malformed business document', { message: e?.message, doc: b })
      }
      return acc
    }, [])

    const resp = NextResponse.json({
      ok: true,
      businesses: businessesWithId,
      pagination: {
        page,
        limit,
        total,
        pages: typeof total === 'number' ? Math.ceil(total / limit) : undefined,
        nextCursor: businesses.length === limit ? (businesses[businesses.length - 1]?.createdAt?.toISOString?.() || null) : null,
      },
      skipped
    })
    const nocache = searchParams.get('nocache') === '1'
    if (nocache) {
      resp.headers.set('Cache-Control', 'no-store')
    } else {
      resp.headers.set('Cache-Control', 's-maxage=120, stale-while-revalidate=300')
    }
    return resp
  } catch (error: any) {
    console.error('Error fetching businesses:', {
      message: error?.message,
      stack: error?.stack,
    })
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
      postalCode: String(form.get("postalCode") || "").trim(),
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
      // Bank fields
      swiftCode: String(form.get("swiftCode") || "").trim(),
      branchCode: String(form.get("branchCode") || "").trim(),
      cityDialingCode: String(form.get("cityDialingCode") || "").trim(),
      iban: String(form.get("iban") || "").trim(),
    }

    // Normalize URL fields: if provided without scheme, prepend https://
    const ensureUrl = (val: string) => {
      if (!val) return val
      if (/^https?:\/\//i.test(val)) return val
      return `https://${val}`
    }
    formData.websiteUrl = ensureUrl(formData.websiteUrl)
    formData.facebookUrl = ensureUrl(formData.facebookUrl)
    formData.gmbUrl = ensureUrl(formData.gmbUrl)
    formData.youtubeUrl = ensureUrl(formData.youtubeUrl)

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
