import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function formatPlainIepDraft(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\|?(?:\s*:?-{2,}:?\s*\|)+\s*$/gm, "")
    .replace(/\|/g, " ")
    .replace(/[‐‑‒–—-]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function POST(req: NextRequest) {
  const { studentName, grade, age, state, disability, isNew, academicLevels, strengths, plaafp, parentConcerns, existingServices, supportingDocs } = await req.json()

  const name = studentName || "the student"
  const ageNum = parseInt(age) || 0
  const transitionNote = ageNum >= 14 ? "NOTE: This student is 14 or older. Transition planning components are LEGALLY REQUIRED under IDEA." : ""

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: `You are a licensed special education specialist and IEP consultant with 20 years of experience writing legally compliant IEPs across all disability categories. You write in the professional language used by experienced special education teachers and IEP teams: strengths based, objective, data informed, family respectful, legally defensible, and focused on educational impact.

Use plain text only. Do not use Markdown, bullets, tables, pipe characters, asterisks, bold markers, hyphen bullets, en dashes, em dashes, or decorative separators. Use numbered section headings and short labeled paragraphs instead.

Professional wording requirements:
Use person first language unless the provided record uses another legally preferred phrasing.
Use neutral descriptions such as requires support with, demonstrates difficulty with, benefits from, and is working toward.
Tie needs to access, participation, and progress in the general education curriculum.
Avoid vague phrases such as struggles a lot, behind, poor behavior, or noncompliant unless quoting source data.
Do not overstate certainty. If data are missing, state that additional baseline data are needed.
Do not invent services, diagnoses, scores, or parent concerns.

Your IEP goals must always include condition, learner, behavior, and measurable criterion. Goals must be directly tied to present levels. Progress monitoring must be specific, frequent, and measurable. You flag every legal compliance issue clearly.`,
    messages: [
      {
        role: "user",
        content: `Generate a complete, legally compliant IEP goals section for the following student.

STUDENT: ${name}
AGE: ${age}
GRADE: ${grade}
STATE: ${state || "not specified"}
DISABILITY / ELIGIBILITY: ${disability}
IEP TYPE: ${isNew === "new" ? "Initial IEP" : isNew === "renewal" ? "Annual Review / Renewal" : "Amendment"}
${transitionNote}

STUDENT STRENGTHS:
${strengths}

CURRENT ACADEMIC PERFORMANCE LEVELS:
${academicLevels || "Not provided"}

PRESENT LEVELS OF ACADEMIC ACHIEVEMENT AND FUNCTIONAL PERFORMANCE (PLAAFP):
${plaafp}

PARENT / GUARDIAN INPUT AND CONCERNS:
${parentConcerns || "Not provided"}

CURRENT / PROPOSED SERVICES:
${existingServices || "Not provided"}

SUPPORTING DOCUMENTS (prior IEPs, evaluations, report cards, behavior data, SIS exports):
${supportingDocs || "None provided"}

---

Please generate the following sections in this exact order.

Formatting rules for the final output:
Plain text only.
No Markdown.
No hyphen characters anywhere.
No bullet points.
No tables.
No pipe characters.
Use numbered sections and numbered items.
Use labels followed by a colon for goal components and compliance flags.
Leave one blank line between major sections.

SECTION 1: STUDENT PROFILE SUMMARY
A 2-3 sentence summary of the student's profile integrating strengths, disability impact, and priority needs. This becomes the opening of the PLAAFP.

SECTION 2: DISABILITY IMPACT STATEMENT
A clear, legally required statement explaining how ${name}'s disability adversely affects their involvement and progress in the general education curriculum (required under IDEA §300.320(a)(1)).

SECTION 3: IDENTIFIED AREAS OF NEED
Write each area of need as a numbered item with a brief explanation of the educational impact. Do not use bullets.

SECTION 4: ANNUAL GOALS
Write 3 measurable, SMART annual goals. For EACH goal provide:
Goal title:
Annual goal statement:
Condition:
Behavior:
Measurable criterion:
Baseline:
Progress monitoring method:
Progress monitoring frequency:

SECTION 5: RECOMMENDED ACCOMMODATIONS AND MODIFICATIONS
Write 5 to 6 specific accommodations or modifications tied directly to the identified needs and disability. Distinguish between accommodations for access and modifications that change curriculum expectations where applicable. Do not use bullets.

SECTION 6: RECOMMENDED SERVICES
Based on the present levels and goals, recommend special education services with suggested frequency, duration, and setting. Flag if existing/proposed services appear insufficient to support the goals.

${ageNum >= 14 ? `SECTION 7: TRANSITION PLANNING REQUIRED
Since ${name} is ${age} years old, include:
Postsecondary vision:
Transition goals:
Agency linkages to consider:
Course of study recommendations:

SECTION 8: LEGAL COMPLIANCE FLAGS` : "SECTION 7: LEGAL COMPLIANCE FLAGS"}

Review ALL information provided and flag every item that is missing, inconsistent, or insufficient for legal compliance under IDEA 2004. Format each flag as a numbered item with these labels: Issue, Why it matters, Required action. Be thorough. Missing parent input, missing baseline data, LRE justification, assessment participation, and prior written notice requirements should all be checked.

Use professional IEP language throughout. Be specific, not generic. Reference actual data points from the provided information wherever possible.`,
      },
    ],
  })

  const rawText = message.content[0].type === "text" ? message.content[0].text : ""
  const text = formatPlainIepDraft(rawText)
  return NextResponse.json({ goals: text })
}
