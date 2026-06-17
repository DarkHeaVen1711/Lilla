import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function proxyRequest(
  req: NextRequest,
  method: "PUT" | "PATCH" | "DELETE",
  id: string
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    let body = undefined;
    if (method !== "DELETE") {
      body = JSON.stringify(await req.json());
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE_URL}/api/addresses/${id}/`, {
      method,
      headers,
      body,
    });

    if (method === "DELETE") {
      if (!res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      }
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(req, "PUT", id);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(req, "PATCH", id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyRequest(req, "DELETE", id);
}
