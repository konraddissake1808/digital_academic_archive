import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { WEEKLY_FREE_DOWNLOAD_LIMIT, getWeeklyFreeDownloadCount } from "@/lib/download-limits";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Resource files were previously stored as full public URLs (from when the
// "resources" bucket was public). Extract the bare storage path either way.
function extractStoragePath(fileUrl: string): string {
  const marker = "/storage/v1/object/public/resources/";
  const idx = fileUrl.indexOf(marker);
  return idx === -1 ? fileUrl : fileUrl.slice(idx + marker.length);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to download this resource" }, { status: 401 });
  }

  const [resource, dbUser, purchase] = await Promise.all([
    prisma.resource.findUnique({ where: { id, isPublished: true } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { tier: true } }),
    prisma.purchase.findUnique({
      where: { userId_resourceId: { userId: user.id, resourceId: id } },
      select: { status: true },
    }),
  ]);

  if (!resource || !resource.fileUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPremium = dbUser?.tier === "PREMIUM";
  const hasPurchased = purchase?.status === "PAID";

  // PREMIUM unlocks every resource with no cap. Otherwise, paid resources
  // still require an existing purchase.
  if (!resource.isFree && !hasPurchased && !isPremium) {
    return NextResponse.json({ error: "Purchase required" }, { status: 403 });
  }

  // FREE-tier users are capped on free-resource downloads per week.
  if (!isPremium && resource.isFree) {
    const count = await getWeeklyFreeDownloadCount(user.id);
    if (count >= WEEKLY_FREE_DOWNLOAD_LIMIT) {
      return NextResponse.json(
        {
          error: `You've reached your ${WEEKLY_FREE_DOWNLOAD_LIMIT} free downloads this week. Upgrade to Premium for unlimited downloads.`,
        },
        { status: 429 }
      );
    }
  }

  const path = extractStoragePath(resource.fileUrl);
  const admin = getAdminClient();
  const { data: signed, error } = await admin.storage
    .from("resources")
    .createSignedUrl(path, 60);

  if (error || !signed) {
    console.error("[download] Could not create signed URL:", error);
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  await prisma.downloadLog.create({ data: { userId: user.id, resourceId: resource.id } });

  return NextResponse.redirect(signed.signedUrl);
}
