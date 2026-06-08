import { NextResponse } from "next/server";

function getWordPressBaseUrl() {
  const baseUrl = process.env.WORDPRESS_API_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

async function proxyRequest(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const baseUrl = getWordPressBaseUrl();

  if (!baseUrl) {
    return NextResponse.json(
      {
        error:
          "Set WORDPRESS_API_URL to point at your WordPress site before using this proxy.",
      },
      { status: 500 },
    );
  }

  const requestUrl = new URL(request.url);
  const targetUrl = new URL(resolvedParams.path.join("/"), baseUrl);
  targetUrl.search = requestUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;