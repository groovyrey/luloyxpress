import { auth } from "@/auth";
import Ably from "ably";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = new Ably.Realtime(process.env.ABLY_API_KEY!);
  const tokenRequestData = await client.auth.createTokenRequest({ clientId: session.user.id });
  return NextResponse.json(tokenRequestData);
}
