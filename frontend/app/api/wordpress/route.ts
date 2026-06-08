import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.WORDPRESS_API_URL?.trim();

  return NextResponse.json({
    configured: Boolean(baseUrl),
    baseUrl: baseUrl ? new URL(baseUrl).origin : null,
    graphqlEndpoint:
      process.env.WORDPRESS_GRAPHQL_ENDPOINT?.trim() ||
      "/graphql",
  });
}