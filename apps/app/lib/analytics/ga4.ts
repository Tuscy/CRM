import { resolveCredential } from "@/lib/analytics/credentials";
import { fetchGa4Overview, fetchGa4Pages } from "@/lib/analytics/ga4-api";

export type AnalyticsSummary = {
  totalUsers: number;
  sessions: number;
};

export type TopPage = {
  path: string;
  views: number;
};

export type AnalyticsResponse = {
  summary: AnalyticsSummary;
  topPages: TopPage[];
};

export async function getClientAnalytics(params: {
  clientId?: string | null;
  startDate: string;
  endDate: string;
}): Promise<AnalyticsResponse> {
  const cred = await resolveCredential(params.clientId ?? null, "GA4");
  if (!cred) {
    throw new Error("No analytics credentials configured for this client");
  }

  const range = dateRangeToKey(params.startDate, params.endDate);

  try {
    const [overview, pages] = await Promise.all([
      fetchGa4Overview(cred.accountId, cred.refreshToken, range),
      fetchGa4Pages(cred.accountId, cred.refreshToken, range),
    ]);

    return {
      summary: {
        totalUsers: overview.users,
        sessions: overview.sessions,
      },
      topPages: pages.map((p) => ({
        path: p.path,
        views: p.sessions,
      })),
    };
  } catch {
    return {
      summary: { totalUsers: 0, sessions: 0 },
      topPages: [],
    };
  }
}

function dateRangeToKey(startDate: string, endDate: string): string {
  if (startDate === "7daysAgo" || startDate === "7d") return "7d";
  if (startDate === "90daysAgo" || startDate === "90d") return "90d";
  if (endDate === "today" && startDate.includes("30")) return "28d";
  return "28d";
}
