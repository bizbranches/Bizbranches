import { NextResponse } from "next/server"
import { getMongoClient } from "@/lib/mongodb"

export const runtime = "nodejs"

export async function GET() {
  try {
    const client = await getMongoClient()
    const admin = client.db().admin()
    const ping = await admin.ping()

    return NextResponse.json(
      {
        ok: true,
        ping,
        serverInfo: await admin.serverStatus().catch(() => undefined),
      },
      { status: 200 },
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || String(err),
      },
      { status: 500 },
    )
  }
}
