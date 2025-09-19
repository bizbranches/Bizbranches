import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const base = process.env.LEOPARDS_API_BASE_URL
  const apiKey = process.env.LEOPARDS_API_KEY
  const apiPassword = process.env.LEOPARDS_API_PASSWORD

  // Optional param for future filtering (kept for compatibility with callers)
  const provinceId = req.nextUrl.searchParams.get("provinceId")

  // If env vars are missing, return a safe fallback to keep UI working
  if (!base || !apiKey || !apiPassword) {
    const fallback = [
      { id: "lahore", name: "Lahore" },
      { id: "karachi", name: "Karachi" },
      { id: "islamabad", name: "Islamabad" },
      { id: "rawalpindi", name: "Rawalpindi" },
      { id: "faisalabad", name: "Faisalabad" },
      { id: "multan", name: "Multan" },
      { id: "peshawar", name: "Peshawar" },
      { id: "quetta", name: "Quetta" },
      { id: "gujranwala", name: "Gujranwala" },
      { id: "sialkot", name: "Sialkot" },
    ]
    // In a future version you can filter by provinceId here if needed
    return NextResponse.json({ ok: true, cities: fallback })
  }

  try {
    const res = await fetch(`${base}/getAllCities/format/json/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, api_password: apiPassword }),
      cache: "no-store",
    })

    const text = await res.text()
    let data: any
    try { data = JSON.parse(text) } catch { data = {} }

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data?.error || `Upstream error ${res.status}`, details: data, upstreamRaw: text })
    }

    if (String(data?.status) !== "1" || !Array.isArray(data?.city_list)) {
      return NextResponse.json({ ok: false, error: "Invalid response", details: data, upstreamRaw: text })
    }

    // Normalize city_list to { id, name }
    let cities = data.city_list.map((c: any) => ({
      id: c?.id ?? c?.CityId ?? c?.city_id ?? c?.code ?? String(c?.name ?? c?.CityName ?? ""),
      name: c?.name ?? c?.CityName ?? c?.city_name ?? String(c?.id ?? c?.CityId ?? c?.city_id ?? c?.code ?? ""),
    }))

    // Optionally filter by provinceId if your upstream supports it; currently we return all
    if (provinceId) {
      // No upstream filter available in this endpoint; keep all for now
      // cities = cities.filter(() => true)
    }

    const out = NextResponse.json({ ok: true, cities })
    // Cache for 1 day on CDN; allow a week stale-while-revalidate.
    out.headers.set("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800")
    return out
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to fetch cities" })
  }
}
