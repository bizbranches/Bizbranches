import { NextResponse, NextRequest } from "next/server"
import { getModels } from "@/lib/models"
import { CreateBusinessSchema, BusinessSchema } from "@/lib/schemas"
import cloudinary from "@/lib/cloudinary"

export const runtime = "nodejs"

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    console.log('GET /api/business - Query params:', { id, slug, category, province, city, area, status, q, page, limit })

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
        business: { ...business, id: business._id.toString() }
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
        business: { ...business, id: business._id.toString() }
      })
    }
    
    // Build filter object for multiple businesses
    const filter: any = {}
    if (category) filter.category = category
    if (province) filter.province = province
    if (city) filter.city = city
    if (area) filter.area = area
    if (status) filter.status = status
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i')
      filter.$or = [
        { name: regex },
        { description: regex },
        { category: regex },
        { province: regex },
        { city: regex },
        { area: regex },
      ]
    }

    console.log('Database filter:', filter)

    const skip = (page - 1) * limit
    
    const businesses = await models.businesses.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await models.businesses.countDocuments(filter)

    console.log(`Found ${businesses.length} businesses, total: ${total}`)
    console.log('First business (if any):', businesses[0])

    // Add id field for each business
    const businessesWithId = businesses.map(business => ({
      ...business,
      id: business._id.toString()
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
      province: String(form.get("province") || "").trim(),
      city: String(form.get("city") || "").trim(),
      address: String(form.get("address") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      contactPerson: String(form.get("contactPerson") || "").trim() || "",
      whatsapp: String(form.get("whatsapp") || "").trim() || "",
      email: String(form.get("email") || "").trim(),
      description: String(form.get("description") || "").trim(),
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
