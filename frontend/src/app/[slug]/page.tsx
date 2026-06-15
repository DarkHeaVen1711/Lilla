import { notFound } from "next/navigation";

const staticPages: Record<string, { title: string; body: string }> = {
  about: {
    title: "About Us",
    body: "We are a premium cosmetics brand dedicated to bringing you the highest quality skincare and makeup products made with natural, clean ingredients. Our products are formulated with the utmost care, ensuring they are cruelty-free, vegan-friendly, and clinically tested to deliver remarkable results.",
  },
  contact: {
    title: "Contact Us",
    body: "Get in touch with us for any questions regarding our products, orders, or partnership opportunities. You can reach our customer support team at support@lilaabeauty.com or call us at +1 (800) 555-0199. We are available Monday through Friday, 9 AM to 6 PM.",
  },
  faqs: {
    title: "FAQs",
    body: "Find answers to frequently asked questions about our products, shipping, returns, and order tracking. If you can't find what you are looking for, feel free to contact our support team.",
  },
  "shipping-policy": {
    title: "Shipping Policy",
    body: "We offer free standard shipping on orders over $100. Standard delivery typically takes 3-5 business days. Express shipping options are available at checkout. We also ship internationally to selected countries; shipping rates and delivery times will be calculated at checkout.",
  },
  returns: {
    title: "Return & Refund Policy",
    body: "If you are not completely satisfied with your purchase, you can return new and unused products within 30 days of purchase for a full refund. Please contact our support team to initiate a return request and obtain a return shipping label.",
  },
  terms: {
    title: "Terms & Conditions",
    body: "Read our terms and conditions governing the use of our website, product purchases, and intellectual property rights. By accessing or using our store, you agree to comply with and be bound by these terms.",
  },
};

export default async function StaticContentPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const page = staticPages[slug];

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-brand-bg-warm px-5 md:px-10 pt-28 md:pt-36 pb-12 md:pb-16">
      <div className="mx-auto max-w-[1440px]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-black/50">Page</p>
        <h1 className="mt-3 text-4xl font-normal font-serif text-black md:text-6xl">{page.title}</h1>
        <p className="mt-8 text-lg leading-8 text-black/70">{page.body}</p>
      </div>
    </main>
  );
}
