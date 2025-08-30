import { NextResponse, NextRequest } from "next/server"
import { getModels } from "@/lib/models"

export const runtime = "nodejs"

// GET endpoint for search suggestions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        ok: true,
        businesses: [],
        categories: [],
      })
    }

    const models = await getModels()
    const regex = new RegExp(query, 'i') // Case-insensitive regex

    // Fetch businesses and categories in parallel
    const [businesses, categories] = await Promise.all([
      models.businesses.find(
        {
          $or: [
            { name: { $regex: regex } },
            { description: { $regex: regex } },
          ],
          status: 'approved', // Only search approved businesses
        },
        { projection: { name: 1, city: 1, category: 1, logoUrl: 1 } } // Project only needed fields
      )
      .limit(5) // Limit business results
      .toArray(),

      models.categories.find(
        { name: { $regex: regex } },
        { projection: { name: 1, slug: 1 } } // Project only needed fields
      )
      .limit(3) // Limit category results
      .toArray(),
    ])

    // Add id field for each business
    const businessesWithId = businesses.map(business => ({
      ...business,
      id: business._id.toString(),
    }))

    return NextResponse.json({
      ok: true,
      businesses: businessesWithId,
      categories,
    })

  } catch (error) {
    console.error('Error fetching search suggestions:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch search suggestions' },
      { status: 500 }
    )
  }
}
