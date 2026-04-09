import { NextRequest, NextResponse } from "next/server"

/**
 * Translation stack:
 * - Optional paid: GOOGLE_TRANSLATE_API_KEY → Google Cloud Translation v2 (batch).
 * - Free default (no key): LibreTranslate public instance, then MyMemory fallback.
 *   Both free tiers can rate-limit; checklist titles in the report use local strings (no API).
 */
const HANGUL = /[\uAC00-\uD7AF]/

function needsKoToEn(text: string) {
  return HANGUL.test(text)
}

/** Google Cloud Translation API v2 — batch in one request (up to CHUNK_SIZE segments). */
const GOOGLE_CHUNK = 50

async function translateWithGoogleBatch(
  segments: { index: number; text: string }[],
  results: string[],
  key: string
): Promise<boolean> {
  if (segments.length === 0) return true

  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: segments.map((s) => s.text),
      source: "ko",
      target: "en",
      format: "text",
    }),
    cache: "no-store",
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[translate] Google API error:", res.status, err)
    return false
  }

  const data = (await res.json()) as {
    data?: { translations?: { translatedText: string }[] }
  }
  const translations = data.data?.translations ?? []
  if (translations.length !== segments.length) {
    console.error("[translate] Google API: unexpected translation count")
    return false
  }

  segments.forEach((seg, j) => {
    const out = translations[j]?.translatedText
    if (out) results[seg.index] = out
  })
  return true
}

async function translateWithGoogleAll(texts: string[]): Promise<string[] | null> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!key) return null

  const results = [...texts]
  const toTranslate: { index: number; text: string }[] = []

  texts.forEach((t, i) => {
    const trimmed = t.trim()
    if (trimmed && needsKoToEn(trimmed)) {
      toTranslate.push({ index: i, text: trimmed })
    }
  })

  if (toTranslate.length === 0) return results

  for (let i = 0; i < toTranslate.length; i += GOOGLE_CHUNK) {
    const chunk = toTranslate.slice(i, i + GOOGLE_CHUNK)
    const ok = await translateWithGoogleBatch(chunk, results, key)
    if (!ok) return null
  }

  return results
}

async function translateLineLibreTranslate(text: string): Promise<string | null> {
  const trimmed = text.trim()
  if (!trimmed || !needsKoToEn(trimmed)) return null

  const q = trimmed.slice(0, 4000)
  try {
    const res = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q,
        source: "ko",
        target: "en",
        format: "text",
      }),
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = (await res.json()) as { translatedText?: string }
    const out = data.translatedText?.trim()
    if (!out) return null
    return trimmed.length > 4000 ? `${out} …` : out
  } catch {
    return null
  }
}

async function translateLineMyMemory(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return text
  if (!needsKoToEn(trimmed)) return text

  const chunk = trimmed.slice(0, 450)
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=ko|en`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return text
  const data = (await res.json()) as {
    responseData?: { translatedText?: string }
    responseStatus?: number
  }
  const out = data.responseData?.translatedText
  if (!out || data.responseStatus === 403) return text
  if (trimmed.length > 450) {
    return `${out} …`
  }
  return out
}

async function translateLineFree(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return text
  if (!needsKoToEn(trimmed)) return text

  const lt = await translateLineLibreTranslate(text)
  if (lt) return lt
  return translateLineMyMemory(text)
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function translateWithFreeTierAll(texts: string[]): Promise<string[]> {
  const translations: string[] = []
  for (let i = 0; i < texts.length; i++) {
    if (i > 0) await delay(120)
    translations.push(await translateLineFree(texts[i]))
  }
  return translations
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { texts?: unknown }
    if (!Array.isArray(body.texts) || body.texts.length === 0) {
      return NextResponse.json({ translations: [] }, { status: 200 })
    }
    const texts = body.texts.filter((t): t is string => typeof t === "string")
    if (texts.length > 40) {
      return NextResponse.json({ error: "Too many strings (max 40)" }, { status: 400 })
    }

    let translations = await translateWithGoogleAll(texts)
    if (!translations) {
      translations = await translateWithFreeTierAll(texts)
    }

    return NextResponse.json({ translations })
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 })
  }
}
