import { NextRequest, NextResponse } from "next/server"
import { getProfileDb } from "@/lib/mongodb-profile"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    if (!process.env.MONGODB_PROFILE_URI) {
      return NextResponse.json({ ok: false, error: "Profiles DB not configured" }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const username = (searchParams.get("username") || "").trim()
    if (!username) {
      return NextResponse.json({ ok: false, error: "username is required" }, { status: 400 })
    }

    const db = await getProfileDb()

    // Try common collections and field names
    const candidates: Array<{ coll: string; filter: any; project?: any }> = [
      { coll: "profiles", filter: { username: new RegExp(`^${username}$`, "i") } },
      { coll: "users", filter: { username: new RegExp(`^${username}$`, "i") } },
      { coll: "users", filter: { handle: new RegExp(`^${username}$`, "i") } },
      { coll: "profiles", filter: { handle: new RegExp(`^${username}$`, "i") } },
    ]

    let doc: any = null
    for (const q of candidates) {
      try {
        const found = await db.collection(q.coll).findOne(q.filter)
        if (found) { doc = found; break }
      } catch {}
    }

    if (!doc) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 })
    }

    // Normalize common fields
    const name = doc.name || doc.fullName || doc.displayName || doc.title || ""
    const title = doc.title || doc.headline || doc.role || ""
    const avatarUrl = doc.avatarUrl || doc.photoUrl || doc.imageUrl || doc.picture || ""

    return NextResponse.json({ ok: true, profile: { username, name, title, avatarUrl } })
  } catch (e: any) {
    console.error("/api/profile error", e?.message || e)
    return NextResponse.json({ ok: false, error: "Failed to fetch profile" }, { status: 500 })
  }
}
