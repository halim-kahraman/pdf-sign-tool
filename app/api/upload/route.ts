import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const fileExt = file.name.split(".").pop()
  const fileName = `${Math.random()}.${fileExt}`

  const { data, error } = await supabase.storage.from("pdfs").upload(fileName, buffer, {
    contentType: file.type,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, path: data.path })
}

