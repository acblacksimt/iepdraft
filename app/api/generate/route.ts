import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { grade, disability, focusArea } = await req.json()

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an experienced special education teacher and IEP specialist. Write 3 measurable, SMART annual IEP goals for the following student:

Grade: ${grade}
Disability / Area of Need: ${disability}
Focus Area: ${focusArea}

Format each goal clearly, numbered 1-3. Each goal must include a condition, behavior, and measurable criteria. Use professional IEP language.`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  return NextResponse.json({ goals: text })
}
