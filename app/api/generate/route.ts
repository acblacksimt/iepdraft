import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { studentName, grade, age, state, disability, isNew, academicLevels, strengths, plaafp, parentConcerns, existingServices, supportingDocs } = await req.json()

  const name = studentName || "the student"
  const ageNum = parseInt(age) || 0
  const transitionNote = ageNum >= 14 ? "NOTE: This student is 14 or older. Transition planning components are LEGALLY REQUIRED under IDEA." : ""

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: `You are a licensed special education specialist and IEP consultant with 20 years of experience writing legally compliant IEPs across all disability categories. You have deep expertise in:
- IDEA 2004 (34 C.F.R. Part 300) compliance requirements
- Writing measurable, SMART annual goals with baselines and progress monitoring
- All 13 IDEA disability categories and evidence-based interventions for each
- State-specific standards alignment
- Transition planning under IDEA for students 14+
- FAPE, LRE, prior written notice, and procedural safeguards
- Best practices from organizations including CEC, NASET, and OSEP

Your IEP goals must always include: condition, learner, behavior, and measurable criterion. Goals must be directly tied to present levels. Progress monitoring must be specific, frequent, and measurable. You flag every legal compliance issue clearly.`,
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

Please generate the following sections in this exact order:

## STUDENT PROFILE SUMMARY
A 2-3 sentence summary of the student's profile integrating strengths, disability impact, and priority needs. This becomes the opening of the PLAAFP.

---

## DISABILITY IMPACT STATEMENT
A clear, legally required statement explaining how ${name}'s disability adversely affects their involvement and progress in the general education curriculum (required under IDEA §300.320(a)(1)).

---

## SECTION 1: IDENTIFIED AREAS OF NEED
List each skill deficit identified from the present levels, with a brief explanation of the educational impact.

---

## SECTION 2: ANNUAL GOALS
Write 3 measurable, SMART annual goals. For EACH goal provide:
- A clear goal title
- The complete goal statement (condition + learner + behavior + measurable criterion + timeline)
- A breakdown table: Condition | Behavior | Measurable Criteria | Baseline | Progress Monitoring Method | Progress Monitoring Frequency

---

## SECTION 3: RECOMMENDED ACCOMMODATIONS AND MODIFICATIONS
List 5-6 specific, evidence-based accommodations tied directly to the identified needs and disability. Distinguish between accommodations (access) and modifications (changes to curriculum) where applicable.

---

## SECTION 4: RECOMMENDED SERVICES
Based on the present levels and goals, recommend special education services with suggested frequency, duration, and setting. Flag if existing/proposed services appear insufficient to support the goals.

---

${ageNum >= 14 ? `## SECTION 5: TRANSITION PLANNING (REQUIRED)
Since ${name} is ${age} years old, include:
- Post-secondary vision (education, employment, independent living)
- Transition goals
- Agency linkages to consider
- Course of study recommendations

---

## SECTION 6: LEGAL COMPLIANCE FLAGS` : "## SECTION 5: LEGAL COMPLIANCE FLAGS"}

Review ALL information provided and flag every item that is missing, inconsistent, or insufficient for legal compliance under IDEA 2004. Format as a table with: Flag # | Issue | Why It Matters | Required Action. Be thorough — missing parent input, missing baseline data, LRE justification, assessment participation, and prior written notice requirements should all be checked.

Use professional IEP language throughout. Be specific, not generic. Reference actual data points from the provided information wherever possible.`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  return NextResponse.json({ goals: text })
}
