import { prisma } from "@stky/db";
import type { GBPLocalPost } from "./types";

function googleDateToJs(
  date?: { year: number; month: number; day: number },
  time?: { hours?: number; minutes?: number }
): Date | null {
  if (!date) return null;
  return new Date(
    date.year,
    date.month - 1,
    date.day,
    time?.hours ?? 0,
    time?.minutes ?? 0
  );
}

function mapPostType(topicType: string): "STANDARD" | "EVENT" | "OFFER" {
  if (topicType === "EVENT" || topicType === "OFFER") return topicType;
  return "STANDARD";
}

/** Upserts a v4 localPost into the GBPPost cache table; returns the row. */
export async function upsertLocalPost(clientId: string, post: GBPLocalPost) {
  const type = mapPostType(post.topicType);
  const schedule = post.event?.schedule;
  const data = {
    clientId,
    type,
    summary: post.summary ?? "",
    ctaType: post.callToAction?.actionType ?? null,
    ctaUrl: post.callToAction?.url ?? null,
    eventTitle: type === "EVENT" ? post.event?.title ?? null : null,
    eventStart: googleDateToJs(schedule?.startDate, schedule?.startTime),
    eventEnd: googleDateToJs(schedule?.endDate, schedule?.endTime),
    offerTitle: type === "OFFER" ? post.event?.title ?? null : null,
    offerCode: post.offer?.couponCode ?? null,
    state: post.state,
    createTime: new Date(post.createTime),
    updateTime: new Date(post.updateTime),
    searchUrl: post.searchUrl ?? null,
  };

  return prisma.gBPPost.upsert({
    where: { googlePostId: post.name },
    create: { googlePostId: post.name, ...data },
    update: data,
  });
}

/**
 * Syncs the full list of API posts for a client into the cache. Posts that
 * exist locally but no longer come back from the API are marked DELETED.
 */
export async function syncLocalPosts(clientId: string, posts: GBPLocalPost[]) {
  const rows = [];
  for (const post of posts) {
    rows.push(await upsertLocalPost(clientId, post));
  }

  const liveNames = posts.map((p) => p.name);
  await prisma.gBPPost.updateMany({
    where: {
      clientId,
      googlePostId: { notIn: liveNames },
      state: { not: "DELETED" },
    },
    data: { state: "DELETED" },
  });

  return rows;
}
