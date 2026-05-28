import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { PDFParse } from "pdf-parse"
import mammoth from "mammoth"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function extractText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  if (ext === "pdf") {
    const parser = new PDFParse(buffer)
    const result = await parser.getText()
    return result.text
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  throw new Error(`Unsupported file type: ${file.name}. Upload a PDF or .docx file.`)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll("files").filter((f): f is File => f instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const sources = await Promise.all(
      files.map(async file => `===== DOCUMENT: ${file.name} =====\n${await extractText(file)}`)
    )
    const documentText = sources.join("\n\n")

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: `You are a special education data extraction assistant. You read prior IEPs, evaluations, report cards, behavior logs, and other student records, and extract structured information to pre-populate a new IEP draft form.

Rules:
- Only extract information that is explicitly present in the documents. Never invent, infer beyond what's stated, or guess.
- If a field is not found in the documents, leave it as an empty string. It is correct and expected to leave fields blank.
- Preserve specific data points: assessment scores, reading levels, frequencies, percentages, dates, and verbatim observations where relevant.
- Summarize narrative fields (academic levels, strengths, present levels, parent concerns, services) concisely but keep concrete details.
- Do not fabricate a student name, age, or grade if not clearly stated.`,
      tools: [
        {
          name: "populate_iep_form",
          description: "Populate the IEP draft form fields with information extracted from the uploaded documents. Leave any field as an empty string if the information is not present in the documents.",
          input_schema: {
            type: "object",
            properties: {
              studentName: { type: "string", description: "Student's first name only. Empty string if not found." },
              age: { type: "string", description: "Student's age in years, digits only (e.g. '9'). Empty string if not found." },
              grade: { type: "string", description: "Grade level (e.g. '4th grade'). Empty string if not found." },
              state: { type: "string", description: "U.S. state. Empty string if not found." },
              disability: { type: "string", description: "Disability / eligibility category (e.g. 'Other Health Impairment — ADHD'). Empty string if not found." },
              academicLevels: { type: "string", description: "Current academic performance: reading level, math, writing, and any assessment scores (DIBELS, FAST, benchmarks, grades). Empty string if not found." },
              strengths: { type: "string", description: "Student strengths: academic strengths, learning preferences, interests, positive behaviors. Empty string if not found." },
              plaafp: { type: "string", description: "Present levels narrative: challenges, behaviors, functional performance, teacher observations, frequency/duration, impact of disability. Empty string if not found." },
              parentConcerns: { type: "string", description: "Parent/guardian concerns, observations from home, and priorities. Empty string if not found." },
              existingServices: { type: "string", description: "Current or proposed services with frequency, duration, and setting. Empty string if not found." },
            },
            required: ["studentName", "age", "grade", "state", "disability", "academicLevels", "strengths", "plaafp", "parentConcerns", "existingServices"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "populate_iep_form" },
      messages: [
        {
          role: "user",
          content: `Extract IEP form information from the following student document(s). Remember: only extract what is explicitly present, and leave fields blank when the information is not there.\n\n${documentText}`,
        },
      ],
    })

    const toolUse = message.content.find(block => block.type === "tool_use")
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ error: "Could not extract information from the documents." }, { status: 422 })
    }

    return NextResponse.json({
      fields: toolUse.input,
      rawText: documentText,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process the documents."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
