"use client"
import { useState } from "react"
import Image from "next/image"

function escapeHtml(text: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }

  return text.replace(/[&<>"']/g, char => entities[char] || char)
}

export default function Home() {
  const [form, setForm] = useState({
    studentName: "",
    grade: "",
    age: "",
    state: "",
    disability: "",
    isNew: "new",
    academicLevels: "",
    strengths: "",
    parentConcerns: "",
    existingServices: "",
    plaafp: "",
    supportingDocs: "",
  })
  const [goals, setGoals] = useState("")
  const [editableGoals, setEditableGoals] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [autofilling, setAutofilling] = useState(false)
  const [autofillError, setAutofillError] = useState("")
  const [filledFields, setFilledFields] = useState<string[]>([])
  // Full raw text of the uploaded document(s). Held in memory (not shown in a box)
  // and merged into the payload at submit so the complete record reaches the generator.
  const [uploadedText, setUploadedText] = useState("")

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const fieldLabels: Record<string, string> = {
    studentName: "Student name",
    age: "Age",
    grade: "Grade level",
    state: "State",
    disability: "Disability / eligibility",
    academicLevels: "Academic levels",
    strengths: "Student strengths",
    plaafp: "Present levels",
    parentConcerns: "Parent input",
    existingServices: "Services",
  }

  async function handleAutofill(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setAutofilling(true)
    setAutofillError("")
    setFilledFields([])
    const fd = new FormData()
    Array.from(files).forEach(f => fd.append("files", f))
    try {
      const res = await fetch("/api/autofill", { method: "POST", body: fd })
      const data = await res.json()
      if (data.error) {
        setAutofillError(data.error)
      } else {
        const fields = data.fields as Record<string, string>
        const rawText = (data.rawText as string) || ""
        const filled: string[] = []
        setForm(prev => {
          const next = { ...prev }
          for (const key of Object.keys(fieldLabels)) {
            const value = (fields[key] || "").trim()
            // Only fill fields the teacher hasn't already entered, so we never clobber manual input.
            if (value && !(prev[key as keyof typeof prev] || "").trim()) {
              next[key as keyof typeof prev] = value
              filled.push(key)
            }
          }
          return next
        })
        // Keep the complete raw text in memory; it's merged into the payload at submit
        // so the generator sees the full record, not just the summarized fields.
        setUploadedText(rawText)
        setFilledFields(filled)
        if (filled.length === 0) {
          setAutofillError("We couldn't match the document to specific fields, but its full text was attached and will be used when generating goals. Add any missing details below.")
        }
      }
    } catch {
      setAutofillError("Something went wrong reading the documents. Please try again or enter details manually.")
    }
    setAutofilling(false)
    e.target.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setGoals("")
    setEditableGoals("")
    // Merge the uploaded document's full raw text with any manually-pasted notes so the
    // complete record reaches the generator from a single upload.
    const supportingDocs = [uploadedText, form.supportingDocs]
      .map(s => s.trim())
      .filter(Boolean)
      .join("\n\n")
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, supportingDocs }),
    })
    const data = await res.json()
    setGoals(data.goals)
    setEditableGoals(data.goals)
    setLoading(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(editableGoals)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  function handleWordDownload() {
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>IEP Draft</title></head>
      <body style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6;">
        <h1 style="font-size: 18pt;">IEP Draft</h1>
        <p style="color: #666; font-size: 10pt;">Generated IEP Goals — iepdraft.com</p>
        <hr/>
        <div style="white-space: pre-wrap;">${escapeHtml(editableGoals).replace(/\n/g, "<br/>")}</div>
      </body></html>
    `
    const blob = new Blob([html], { type: "application/msword" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `IEP-Draft-${form.studentName || "Goals"}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  const inputClass = "w-full border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1"
  const hintClass = "text-xs text-slate-400 mb-2"

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; font-family: Arial, sans-serif; }
          .print-area { box-shadow: none; border: none; padding: 20px; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50">
        <header className="no-print bg-white border-b border-slate-200 px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Image src="/Logos-03.png" alt="IEP Draft" width={140} height={48} className="object-contain" priority />
            <span className="text-xs bg-blue-50 text-blue-600 font-medium px-3 py-1 rounded-full">Beta</span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-10">
          <div className="no-print bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Generate IEP Goals</h2>
            <p className="text-sm text-slate-500 mb-6">Complete each section below. The more detail you provide, the more accurate and legally compliant your IEP goals will be.</p>

            {/* Auto-fill from documents */}
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Start from existing documents <span className="text-slate-400 font-normal">(optional)</span></h3>
                  <p className="text-xs text-slate-500 mt-1">Upload one or more prior IEPs, evaluations, reports, or progress notes (PDF or .docx). We&apos;ll auto-fill any fields we can find <em>and</em> include the full text from every document when generating. You can review and edit everything first.</p>
                </div>
                <label className={`shrink-0 inline-flex items-center gap-2 cursor-pointer text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition ${autofilling ? "opacity-50 pointer-events-none" : ""}`}>
                  {autofilling ? "Reading…" : "Upload documents"}
                  <input type="file" accept=".pdf,.docx" multiple onChange={handleAutofill} className="hidden" />
                </label>
              </div>
              {autofillError && <p className="text-xs text-amber-700 mt-3">{autofillError}</p>}
              {filledFields.length > 0 && (
                <p className="text-xs text-green-700 mt-3">
                  ✓ Auto-filled {filledFields.length} field{filledFields.length === 1 ? "" : "s"}: {filledFields.map(f => fieldLabels[f]).join(", ")}. The full text from each uploaded document is also attached and will be used when generating. Review and edit below.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Student Info */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Student Information</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelClass}>Student First Name <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input value={form.studentName} onChange={e => update("studentName", e.target.value)} type="text" placeholder="e.g. Marcus" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Age</label>
                    <input value={form.age} onChange={e => update("age", e.target.value)} type="text" placeholder="e.g. 9" className={inputClass} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelClass}>Grade Level</label>
                    <input value={form.grade} onChange={e => update("grade", e.target.value)} type="text" placeholder="e.g. 4th grade" className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input value={form.state} onChange={e => update("state", e.target.value)} type="text" placeholder="e.g. New York" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Disability / Eligibility Category</label>
                    <input value={form.disability} onChange={e => update("disability", e.target.value)} type="text" placeholder="e.g. Other Health Impairment — ADHD" className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>IEP Type</label>
                    <select value={form.isNew} onChange={e => update("isNew", e.target.value)} className={inputClass}>
                      <option value="new">Initial IEP (new student)</option>
                      <option value="renewal">Annual Review / Renewal</option>
                      <option value="amendment">Amendment</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Academic Levels */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Academic Performance</h3>
                <label className={labelClass}>Current Academic Levels</label>
                <p className={hintClass}>Include reading level, math performance, writing skills, and any recent assessment scores (e.g., DIBELS, FAST, benchmark scores, grades).</p>
                <textarea
                  value={form.academicLevels}
                  onChange={e => update("academicLevels", e.target.value)}
                  rows={3}
                  placeholder="e.g. Reading at 2nd grade level. DIBELS ORF score: 45 wpm (benchmark: 115). Math performing at grade level. Writing shows difficulty with sentence structure and organization."
                  className={inputClass + " resize-none"}
                />
              </div>

              <hr className="border-slate-100" />

              {/* Strengths */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Student Strengths</h3>
                <label className={labelClass}>What does this student do well?</label>
                <p className={hintClass}>IDEA requires strengths to be documented. Include academic strengths, learning preferences, interests, and positive behaviors.</p>
                <textarea
                  value={form.strengths}
                  onChange={e => update("strengths", e.target.value)}
                  rows={2}
                  placeholder="e.g. Strong verbal skills, participates actively in class discussions, excels in small group settings, highly motivated by science topics, responds well to praise."
                  className={inputClass + " resize-none"}
                  required
                />
              </div>

              <hr className="border-slate-100" />

              {/* Present Levels */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Present Levels (PLAAFP Narrative)</h3>
                <label className={labelClass}>Describe the student&apos;s challenges, behaviors, and functional performance</label>
                <p className={hintClass}>Include teacher observations, specific difficulties, frequency/duration of behaviors, and how the disability impacts access to general education. The more specific, the better.</p>
                <textarea
                  value={form.plaafp}
                  onChange={e => update("plaafp", e.target.value)}
                  rows={5}
                  placeholder="e.g. Marcus has significant difficulty sustaining attention during independent work tasks. Teacher observation indicates he completes approximately 40% of assigned work during a 45-minute period. He frequently loses materials. BASC-3 scores are clinically significant in attention and study skills subscales. He requires frequent adult prompting to remain on task."
                  className={inputClass + " resize-none"}
                  required
                />
              </div>

              <hr className="border-slate-100" />

              {/* Parent Concerns */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Parent / Guardian Input</h3>
                <label className={labelClass}>What are the parent&apos;s concerns and priorities?</label>
                <p className={hintClass}>IDEA requires meaningful parent participation. Include concerns, observations from home, and their priorities for this IEP.</p>
                <textarea
                  value={form.parentConcerns}
                  onChange={e => update("parentConcerns", e.target.value)}
                  rows={2}
                  placeholder="e.g. Parents report Marcus struggles to complete homework independently. They are concerned about his confidence and self-esteem. They want him to improve his organizational skills and feel more successful in school."
                  className={inputClass + " resize-none"}
                />
              </div>

              <hr className="border-slate-100" />

              {/* Existing Services */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Current / Proposed Services</h3>
                <label className={labelClass}>What services does this student currently receive or are being proposed?</label>
                <p className={hintClass}>Include type of service, frequency, duration, and setting (e.g., resource room, push-in, counseling).</p>
                <textarea
                  value={form.existingServices}
                  onChange={e => update("existingServices", e.target.value)}
                  rows={2}
                  placeholder="e.g. Currently receiving 45 min/week of resource room support for reading. Proposing adding 30 min/week of organizational skills instruction with special education teacher."
                  className={inputClass + " resize-none"}
                />
              </div>

              <hr className="border-slate-100" />

              {/* Additional Notes */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Additional Notes <span className="text-slate-400 font-normal normal-case">(optional)</span></h3>
                <label className={labelClass}>Paste any extra data not in an uploaded document</label>
                <p className={hintClass}>Document(s) you upload above are already included in full. Use this box only to add notes, prior IEP goals, evaluation results, or behavior data that you&apos;re entering by hand. The more data you provide, the more accurate your goals will be.</p>
                <textarea
                  value={form.supportingDocs}
                  onChange={e => update("supportingDocs", e.target.value)}
                  rows={4}
                  placeholder="Paste prior IEP goals, evaluation results, report card comments, behavior data, attendance records, or any other relevant student data here..."
                  className={inputClass + " resize-none"}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition text-sm mt-2"
              >
                {loading ? "Generating IEP Goals..." : "Generate IEP Goals"}
              </button>
            </form>
          </div>

          {/* Output */}
          {goals && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 print-area">
              <div className="flex items-center justify-between mb-6 no-print">
                <h2 className="text-lg font-semibold text-slate-900">Generated IEP Goals</h2>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button onClick={handleCopy} className="text-sm px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition">
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={handleWordDownload} className="text-sm px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition">
                    Word Doc
                  </button>
                  <button onClick={handlePrint} className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                    Save PDF
                  </button>
                </div>
              </div>

              <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold">IEP Draft</h1>
                <p className="text-sm text-slate-500">Generated IEP Goals — iepdraft.com</p>
                <hr className="mt-3" />
              </div>

              <textarea
                value={editableGoals}
                onChange={e => setEditableGoals(e.target.value)}
                className="w-full min-h-[48rem] border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed whitespace-pre-wrap print:hidden"
                rows={38}
                aria-label="Editable generated IEP goals"
              />
              <div className="hidden print:block whitespace-pre-wrap text-sm leading-relaxed text-slate-900">{editableGoals}</div>

              <p className="no-print mt-6 text-xs text-slate-400 border-t border-slate-100 pt-4">
                Always review generated goals against the student&apos;s current baseline data and PLAAFP before including in a finalized IEP.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
