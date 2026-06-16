import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    // 1. Extract validation secret token from query string or headers
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret") || req.headers.get("x-revalidate-secret");
    
    const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || "default_revalidation_secret";
    
    if (secret !== REVALIDATION_SECRET) {
      return NextResponse.json({ message: "Invalid secret token" }, { status: 401 });
    }
    
    // 2. Parse tags from request JSON payload
    const body = await req.json();
    const tags = body.tags;
    
    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({ message: "Missing or invalid tags parameter" }, { status: 400 });
    }
    
    // 3. Invoke next/cache tag revalidation
    for (const tag of tags) {
      revalidateTag(tag);
      console.log(`[Next.js Revalidation] Revalidated cache tag: ${tag}`);
    }
    
    return NextResponse.json({ revalidated: true, tags, now: Date.now() }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
