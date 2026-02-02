import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  const convo = await prisma.conversation.create({ data: {} });
  return NextResponse.json({ conversationId: convo.id });
}

