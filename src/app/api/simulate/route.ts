import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Using llama-3.3-70b — Groq's best free model, fast & capable
const MODEL = "llama-3.3-70b-versatile";

const ADVISORS = [
  {
    id: "optimist",
    prompt: `You are The Visionary — a bold, opportunity-focused advisor. Your job is to argue for the BEST possible outcome of this decision. Highlight upside potential, growth opportunities, and what success looks like. Be specific, data-minded, and compelling. Speak in 3-4 punchy paragraphs. No bullet points. Be direct and confident.`,
  },
  {
    id: "devil",
    prompt: `You are The Contrarian — a sharp, critical risk analyst. Your job is to stress-test this decision and expose every flaw, risk, and blind spot. What could go wrong? What are the hidden costs? What assumptions are dangerous? Be specific and unflinching. Speak in 3-4 punchy paragraphs. No bullet points. Be direct.`,
  },
  {
    id: "pragmatist",
    prompt: `You are The Realist — a grounded, systems-thinking strategist. Your job is to cut through optimism and pessimism and give the actual likely outcome. Consider the realistic scenario, the key variables that will determine success or failure, and what the person actually needs to do. Speak in 3-4 punchy paragraphs. No bullet points. Be pragmatic and useful.`,
  },
];

const SYNTHESIS_PROMPT = `You are a master decision analyst who has just heard three advisors debate a decision.

Visionary said: {optimist}

Contrarian said: {devil}

Realist said: {pragmatist}

Now synthesize these views. Respond ONLY in this exact JSON format, no markdown, no extra text:
{
  "verdict": "...",
  "confidence": 72,
  "swingFactor": "...",
  "actions": ["...", "...", "..."],
  "verdictType": "proceed"
}

verdictType must be one of: "proceed", "pause", or "avoid".`;

async function getAdvisorOpinion(
  decision: string,
  context: string,
  advisor: (typeof ADVISORS)[0]
): Promise<string> {
  const msg = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 600,
    messages: [
      { role: "system", content: advisor.prompt },
      {
        role: "user",
        content: `The decision to evaluate: "${decision}"${context ? `\n\nAdditional context: ${context}` : ""}`,
      },
    ],
  });
  return msg.choices[0]?.message?.content ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const { decision, context } = await req.json();

    if (!decision || decision.trim().length < 10) {
      return NextResponse.json(
        { error: "Decision must be at least 10 characters." },
        { status: 400 }
      );
    }

    // Run all three advisors in parallel
    const [optimist, devil, pragmatist] = await Promise.all(
      ADVISORS.map((a) => getAdvisorOpinion(decision, context ?? "", a))
    );

    const opinions = { optimist, devil, pragmatist };

    // Synthesize
    const synthPrompt = SYNTHESIS_PROMPT.replace("{optimist}", optimist)
      .replace("{devil}", devil)
      .replace("{pragmatist}", pragmatist);

    const synthMsg = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      response_format: { type: "json_object" }, // Groq supports native JSON mode!
      messages: [
        {
          role: "system",
          content: "You are a decision synthesis engine. Always respond in valid JSON only.",
        },
        {
          role: "user",
          content: `Decision: "${decision}"\n\n${synthPrompt}`,
        },
      ],
    });

    const raw = synthMsg.choices[0]?.message?.content ?? "{}";
    let synthesis;
    try {
      synthesis = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      synthesis = {
        verdict: "Analysis inconclusive.",
        confidence: 50,
        swingFactor: "Unknown",
        actions: [],
        verdictType: "pause",
      };
    }

    return NextResponse.json({ opinions, synthesis });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Simulation failed. Check your API key." },
      { status: 500 }
    );
  }
}
