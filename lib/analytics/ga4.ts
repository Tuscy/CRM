import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

type AnalyticsView =
  | "summary"
  | "top-pages";

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

function getAnalyticsDataClient() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth client env vars not configured");
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URL
  );

  return { auth: client, api: google.analyticsdata("v1beta") };
}

async function getConnectionForClient(clientId: string) {
  const connection = await prisma.analyticsConnection.findFirst({
    where: { clientId },
  });
  if (!connection) {
    throw new Error("No analytics connection configured for this client");
  }
  return connection;
}

export async function getClientAnalytics(params: {
  clientId: string;
  startDate: string;
  endDate: string;
}): Promise<AnalyticsResponse> {
  const connection = await getConnectionForClient(params.clientId);

  if (!connection.refreshToken) {
    // Not yet connected to GA4
    return {
      summary: { totalUsers: 0, sessions: 0 },
      topPages: [],
    };
  }

  const { auth, api } = getAnalyticsDataClient();
  auth.setCredentials({
    refresh_token: connection.refreshToken,
  });

  const property = connection.gaPropertyId;

  // Overview metrics
  const [summaryResult, topPagesResult] = await Promise.all([
    api.properties.runReport({
      auth,
      property,
      requestBody: {
        dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
        metrics: [{ name: "totalUsers" }, { name: "sessions" }],
      },
    }),
    api.properties.runReport({
      auth,
      property,
      requestBody: {
        dateRanges: [{ startDate: params.startDate, endDate: params.endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        limit: 10,
        orderBys: [
          { metric: { metricName: "screenPageViews" }, desc: true },
        ],
      },
    }),
  ]);

  const summaryRow = summaryResult.data.rows?.[0];
  const summary: AnalyticsSummary = {
    totalUsers: summaryRow ? Number(summaryRow.metricValues?.[0]?.value ?? 0) : 0,
    sessions: summaryRow ? Number(summaryRow.metricValues?.[1]?.value ?? 0) : 0,
  };

  const topPages: TopPage[] =
    topPagesResult.data.rows?.map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "",
      views: Number(row.metricValues?.[0]?.value ?? 0),
    })) ?? [];

  return { summary, topPages };
}

