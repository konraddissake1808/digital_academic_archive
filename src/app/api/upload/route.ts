import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// "resources" holds the actual downloadable files and stays private — access is
// brokered through /api/resources/[id]/download after checking sign-in + purchase.
// "covers" holds thumbnail images, which are meant to be publicly visible.
type UploadKind = "file" | "cover";

async function ensureBucket(
  admin: ReturnType<typeof getAdminClient>,
  bucket: string,
  isPublic: boolean
) {
  const { error } = await admin.storage.createBucket(bucket, {
    public: isPublic,
    allowedMimeTypes: undefined,
    fileSizeLimit: null,
  });
  if (!error) return;
  if (!error.message.includes("already exists")) throw error;
  // Bucket already existed (possibly from before this bucket's visibility was
  // decided) — make sure its visibility matches what we expect now.
  const { error: updateError } = await admin.storage.updateBucket(bucket, {
    public: isPublic,
    fileSizeLimit: null,
  });
  if (updateError) throw updateError;
}

export async function POST(request: Request) {
  // Verify the user is a publisher or admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || (dbUser.role !== "PUBLISHER" && dbUser.role !== "ADMIN")) {
    return NextResponse.json({ error: "Only publishers and admins can upload files" }, { status: 403 });
  }

  // Receive file as multipart/form-data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const kind: UploadKind = formData.get("type") === "cover" ? "cover" : "file";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bucket = kind === "cover" ? "covers" : "resources";
  const isPublic = kind === "cover";

  const filePath = `${user.id}/${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const admin = getAdminClient();

  try {
    await ensureBucket(admin, bucket, isPublic);
  } catch (err) {
    console.error("[upload] Could not prepare bucket:", err);
    const message = err instanceof Error ? err.message : "Could not prepare storage bucket";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data, error } = await admin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    console.error("[upload] Supabase storage error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Cover images are public — store the real public URL for direct <img> use.
  // Resource files are private — store the bare storage path; access is brokered
  // through the authenticated download route, which mints a short-lived signed URL.
  if (isPublic) {
    const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(data.path);
    return NextResponse.json({ url: publicUrl });
  }

  return NextResponse.json({ url: data.path });
}
