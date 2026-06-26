import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || (dbUser.role !== "PUBLISHER" && dbUser.role !== "ADMIN")) {
    return NextResponse.json(
      { error: "Only publishers and admins can upload files" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { fileName } = body;

  if (!fileName || typeof fileName !== "string") {
    return NextResponse.json(
      { error: "fileName is required" },
      { status: 400 }
    );
  }

  const filePath = `${user.id}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from("resources")
    .createSignedUploadUrl(filePath);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path: data.path,
    token: data.token,
  });
}
