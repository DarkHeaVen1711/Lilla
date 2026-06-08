const staticPages: Record<string, { title: string; body: string }> = {
  about: {
    title: "About Us",
    body: "This storefront is powered by WordPress for content and by the browser for cart and favourites state.",
  },
  contact: {
    title: "Contact Us",
    body: "Use the WordPress backend to manage contact details, forms, and support content.",
  },
  faqs: {
    title: "FAQs",
    body: "Frequently asked questions can be added from WordPress and surfaced here as dynamic content.",
  },
  "shipping-policy": {
    title: "Shipping Policy",
    body: "Shipping policy content should be managed from WordPress so edits publish without code changes.",
  },
  returns: {
    title: "Return & Refund Policy",
    body: "Return and refund policy content should come from WordPress.",
  },
  terms: {
    title: "Terms & Conditions",
    body: "Terms and conditions content should be controlled from WordPress.",
  },
};

async function fetchWordPressPage(slug: string) {
  const endpoint = process.env.WORDPRESS_GRAPHQL_ENDPOINT?.trim() || "/graphql";
  const baseUrl = process.env.WORDPRESS_API_URL?.trim();
  if (!baseUrl) return null;
  const url = new URL(
    endpoint.replace(/^\//, ""),
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );

  const query = `
    query GetPageBySlug($id: ID!) {
      page(id: $id, idType: URI) {
        title
        content
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { id: slug } }),
      next: { revalidate: 60 },
    });
    const json = await res.json();
    return json.data?.page;
  } catch (e) {
    return null;
  }
}

export default async function StaticContentPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const page = staticPages[slug];

  const wpPage = await fetchWordPressPage(slug);

  if (wpPage) {
    return (
      <main className="min-h-screen bg-[#faf7f4] px-5 md:px-10 py-12 md:py-16">
        <div className="mx-auto max-w-[1440px]">
          <h1 className="mt-3 text-4xl font-semibold text-black md:text-6xl">
            {wpPage.title}
          </h1>
          {wpPage.featuredImage?.node?.sourceUrl && (
            <div className="my-8 w-full">
              <img
                src={wpPage.featuredImage.node.sourceUrl}
                alt={wpPage.featuredImage.node.altText || wpPage.title}
                className="w-full rounded-lg object-cover"
              />
            </div>
          )}
          <div
            className="mt-8 prose prose-lg max-w-none text-black/80"
            dangerouslySetInnerHTML={{ __html: wpPage.content }}
          />
        </div>
      </main>
    );
  }

  if (!page) {
    return (
      <main className="min-h-screen bg-[#faf7f4] px-5 md:px-10 py-12 md:py-16">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-black/50">Page</p>
          <h1 className="mt-3 text-4xl font-normal font-serif text-black md:text-6xl">{slug.replace(/-/g, " ")}</h1>
          <p className="mt-4 text-lg text-black/70">This route is active and ready to be powered from WordPress when content is added.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f4] px-5 md:px-10 py-12 md:py-16">
      <div className="mx-auto max-w-[1440px]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-black/50">Page</p>
        <h1 className="mt-3 text-4xl font-normal font-serif text-black md:text-6xl">{page.title}</h1>
        <p className="mt-4 text-lg leading-8 text-black/70">{page.body}</p>
      </div>
    </main>
  );
}
