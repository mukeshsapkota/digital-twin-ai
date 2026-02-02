import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function extractEmail(text: string) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0];
}

function extractName(text: string) {
  const m1 = text.match(/my name is\s+([a-zA-Z ]{2,40})/i);
  const m2 = text.match(/i am\s+([a-zA-Z ]{2,40})/i);
  const m3 = text.match(/i'm\s+([a-zA-Z ]{2,40})/i);
  return (m1?.[1] || m2?.[1] || m3?.[1])?.trim();
}

function lower(s: string) {
  return s.toLowerCase().trim();
}

const LINKS = {
  github: "https://github.com/your-github",
  linkedin: "https://www.linkedin.com/in/your-linkedin",
  resume: "/Mukesh-Sapkota-Resume.pdf",
  calendly: process.env.CALENDLY_URL || "(set CALENDLY_URL in .env)",
};

const PROFILE = {
  name: "Mukesh Sapkota",
  title: "Full-Stack Developer (Next.js / React / TypeScript)",
  location: "Australia (Sydney/Melbourne) — open to remote/hybrid",
  summary: [
    "Full-stack developer focused on production web apps with clean UI + reliable backend.",
    "Builds Next.js apps with API routes, auth, CRUD, and database workflows (Prisma + SQL).",
    "Can ship real products end-to-end: UX → API → DB → deployment.",
  ],
  skills: {
    frontend: ["Next.js", "React", "TypeScript", "Tailwind CSS", "UI/UX basics"],
    backend: ["Node.js", "Next.js API routes", "REST", "Auth patterns", "Validation (Zod)"],
    data: ["Prisma", "SQLite/Postgres", "Schema design", "Migrations"],
    ai: ["Web & voice agents", "Conversation tracking", "Lead capture", "Agent-style workflows"],
    tools: ["Git/GitHub", "Vercel deployment", "Debugging", "Spec-driven dev"],
  },
  projects: [
    {
      name: "Digital Twin II (Web + Voice)",
      points: [
        "Production-style Next.js app: chat UI + voice input + spoken replies.",
        "Stores conversations, messages, and recruiter leads in a database (Prisma + SQLite).",
        "Built with clean API routes and extensible architecture for future AI upgrades.",
      ],
    },
    {
      name: "Digital Twin I (Persona/Intelligence layer)",
      points: [
        "Defined persona, messaging style, and recruiter-friendly responses.",
        "Structured prompts/knowledge to reflect skills and professional brand.",
      ],
    },
  ],
  availability:
    "Available for full-time roles and interviews. Prefer full-stack or frontend roles; open to backend-heavy roles with Next.js/Node.",
};

function formatBullets(items: string[]) {
  return items.map((x) => `- ${x}`).join("\n");
}

function reply(content: string) {
  const s = lower(content);

  if (s.includes("resume") || s.includes("cv")) {
    return `Sure — you can download my resume here: ${LINKS.resume}\n\nAlso happy to tailor highlights to your role. What position are you hiring for?`;
  }

  if (s.includes("github")) return `Here’s my GitHub: ${LINKS.github}`;
  if (s.includes("linkedin")) return `Here’s my LinkedIn: ${LINKS.linkedin}`;

  if (s.includes("book") || s.includes("call") || s.includes("meeting")) {
    return `Happy to chat. Book a call here: ${LINKS.calendly}\n\nOr share your email and I’ll follow up.`;
  }

  if (s.includes("skills") || s.includes("tech stack") || s.includes("stack")) {
    return `I’m ${PROFILE.name}, ${PROFILE.title}.\n\nCore skills:\nFrontend:\n${formatBullets(
      PROFILE.skills.frontend
    )}\n\nBackend:\n${formatBullets(PROFILE.skills.backend)}\n\nData:\n${formatBullets(
      PROFILE.skills.data
    )}\n\nWant me to map my skills to a specific job description?`;
  }

  if (s.includes("project") || s.includes("portfolio") || s.includes("experience")) {
    const p = PROFILE.projects
      .map(
        (x) => `**${x.name}**\n${formatBullets(x.points)}`
      )
      .join("\n\n");
    return `Here are my key projects:\n\n${p}\n\nIf you tell me the role, I’ll highlight the most relevant parts.`;
  }

  if (s.includes("available") || s.includes("availability") || s.includes("location")) {
    return `${PROFILE.availability}\nLocation: ${PROFILE.location}\n\nWhat type of role is it (full-stack/front-end/back-end) and what’s the tech stack?`;
  }

  if (s.includes("about you") || s.includes("introduce") || s.includes("tell me about")) {
    return `Hi — I’m ${PROFILE.name}. ${PROFILE.summary.join(" ")}\n\nAsk me about my skills, projects, or availability.`;
  }

  if (s.includes("salary") || s.includes("rate")) {
    return `I’m flexible depending on the role scope and location. If you share the role level and range, I can confirm alignment.`;
  }

  // Default
  return `Hi — I’m ${PROFILE.name}’s Digital Twin.\n\nYou can ask:\n- “What are your skills?”\n- “Show your projects”\n- “Are you available?”\n- “Share your resume”\n\nIf you’re hiring, tell me the role and I’ll summarize why I’m a fit.`;
}

export async function POST(req: Request) {
  try {
    const { conversationId, content } = await req.json();

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "conversationId and content are required" },
        { status: 400 }
      );
    }

    // Save user message
    await prisma.message.create({
      data: { conversationId, role: "user", content },
    });

    // Lead capture
    const email = extractEmail(content);
    const name = extractName(content);

    if (email || name) {
      await prisma.lead.upsert({
        where: { conversationId },
        update: { email: email ?? undefined, name: name ?? undefined, status: "new" },
        create: { conversationId, email: email ?? undefined, name: name ?? undefined, status: "new" },
      });
    }

    const out = reply(content);

    // Save assistant reply
    await prisma.message.create({
      data: { conversationId, role: "assistant", content: out },
    });

    return NextResponse.json({ reply: out });
  } catch (err: any) {
    console.error("POST /api/messages error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}

