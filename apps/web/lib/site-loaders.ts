import { prisma } from "@stky/db";

export async function getSiteByHost(host: string) {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  const root = process.env.ROOT_DOMAIN?.toLowerCase();

  const byDomain = await prisma.site.findFirst({
    where: { customDomain: h },
  });
  if (byDomain) return byDomain;

  if (root && h.endsWith(`.${root}`)) {
    const sub = h.slice(0, -(root.length + 1));
    if (sub) {
      const bySub = await prisma.site.findFirst({
        where: { subdomain: sub },
      });
      if (bySub) return bySub;
    }
  }

  return null;
}

export async function resolveSiteForRequest(host: string, headerSiteId: string | null) {
  if (headerSiteId) {
    const site = await prisma.site.findUnique({ where: { id: headerSiteId } });
    if (site) return site;
  }

  const devId = process.env.DEV_SITE_ID;
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  if (h === "localhost" && devId) {
    const site = await prisma.site.findUnique({ where: { id: devId } });
    if (site) return site;
  }

  return getSiteByHost(host);
}

export async function getPublishedPage(siteId: string, slugSegments: string[] | undefined) {
  const slug =
    !slugSegments || slugSegments.length === 0 ? "" : slugSegments.join("/");

  return prisma.page.findFirst({
    where: {
      siteId,
      slug,
      published: true,
    },
    include: {
      sections: { orderBy: { order: "asc" } },
    },
  });
}
