import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SectionRenderer } from "@stky/builder";
import { getPublishedPage, resolveSiteForRequest } from "@/lib/site-loaders";
import type { Metadata } from "next";

type Props = { params: { slug?: string[] } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const headerSiteId = headersList.get("x-stky-site-id");
  const site = await resolveSiteForRequest(host, headerSiteId);
  if (!site) return { title: "Not found" };

  const page = await getPublishedPage(site.id, params.slug);
  const seo = (page?.seo as { title?: string; description?: string } | null) ?? null;
  return {
    title: seo?.title ?? site.slug ?? "Site",
    description: seo?.description ?? undefined,
  };
}

export default async function SitePage({ params }: Props) {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const headerSiteId = headersList.get("x-stky-site-id");
  const site = await resolveSiteForRequest(host, headerSiteId);

  if (!site) {
    notFound();
  }

  const page = await getPublishedPage(site.id, params.slug);
  if (!page) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <SectionRenderer sections={page.sections} />
    </main>
  );
}
