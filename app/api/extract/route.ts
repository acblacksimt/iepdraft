import { NextRequest, NextResponse } from "next/server"
import { PDFParse } from "pdf-parse"
import mammoth from "mammoth"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  if (ext === "pdf") {
    const parser = new PDFParse(buffer)
    const result = await parser.getText()
    return NextResponse.json({ text: result.text })
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer })
    return NextResponse.json({ text: result.value })
  }

  return NextResponse.json({ error: "Unsupported file type. Upload a PDF or .docx file." }, { status: 400 })
}
