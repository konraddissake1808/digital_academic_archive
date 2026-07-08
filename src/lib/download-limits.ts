import { prisma } from "@/lib/prisma";

export const WEEKLY_FREE_DOWNLOAD_LIMIT = 15;

// Free-tier users are capped on free-resource downloads only — redownloading
// something already purchased never counts against the cap, and PREMIUM
// users are exempt entirely (checked by the caller).
export async function getWeeklyFreeDownloadCount(userId: string): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return prisma.downloadLog.count({
    where: {
      userId,
      downloadedAt: { gte: sevenDaysAgo },
      resource: { isFree: true },
    },
  });
}
