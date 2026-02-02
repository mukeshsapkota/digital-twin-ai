import { prisma } from "@/lib/db";

export async function logIntent(conversationId: string, intent: string, tool?: string, payload?: unknown) {
  await prisma.agentLog.create({
    data: {
      conversationId,
      intent,
      tool,
      payload: payload ? JSON.stringify(payload) : undefined,
    },
  });
}

export async function upsertLead(
  conversationId: string,
  lead: { name?: string; email?: string; company?: string; role?: string; status?: string }
) {
  return prisma.lead.upsert({
    where: { conversationId },
    update: { ...lead },
    create: { conversationId, ...lead },
  });
}

