"use client"
import { useState } from "react"

export default function Home() {
  const [grade, setGrade] = useState("")
  const [disability, setDisability] = useState("")
  const [focusArea, setFocusArea] = useState("")
  const [goals, setGoals] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade, disability, focusArea }),
    })
    const data = await res.json()
    setGoals(data.goals)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">IEP Draft</h1>
        <p className="text-gray-500 mb-6">Generate measurable IEP goals in seconds.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Grade</label>
            <input value={grade} onChange={e => setGrade(e.target.value)} type="text" placeholder="e.g. 3rd grade" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disability / Area of Need</label>
            <input value={disability} onChange={e => setDisability(e.target.value)} type="text" placeholder="e.g. Dyslexia, ADHD, autism spectrum" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Focus Area</label>
            <input value={focusArea} onChange={e => setFocusArea(e.target.value)} type="text" placeholder="e.g. reading comprehension, math fluency, behavior" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
            {loading ? "Generating..." : "Generate IEP Goals"}
          </button>
        </form>

        {goals && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
            {goals}
          </div>
        )}
      </div>
    </main>
  )
}
