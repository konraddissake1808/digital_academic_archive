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

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const filePath = `${user.id}/${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const admin = getAdminClient();

  // Ensure the bucket exists (creates it on first upload if missing)
  const { error: bucketError } = await admin.storage.createBucket("resources", {
    public: true,
    allowedMimeTypes: undefined,
    fileSizeLimit: null,
  });
  // Ignore "already exists" error
  if (bucketError && !bucketError.message.includes("already exists")) {
    console.error("[upload] Could not create bucket:", bucketError);
    return NextResponse.json({ error: bucketError.message }, { status: 500 });
  }

  const { data, error } = await admin.storage
    .from("resources")
    .upload(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    console.error("[upload] Supabase storage error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("resources").getPublicUrl(data.path);

  return NextResponse.json({ publicUrl });
}
