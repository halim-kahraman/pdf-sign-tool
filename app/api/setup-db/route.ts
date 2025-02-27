import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    // Create documents table
    const { error: tableError } = await supabaseServer.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Uploaded',
        file_path TEXT NOT NULL,
        url TEXT,
        shared_with TEXT,
        shared_at TIMESTAMP WITH TIME ZONE,
        signed_at TIMESTAMP WITH TIME ZONE,
        signature_path TEXT,
        signature_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    if (tableError) throw tableError

    // Create storage buckets if they don't exist
    const { error: pdfBucketError } = await supabaseServer.storage.createBucket("pdfs", {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ["application/pdf"],
    })

    const { error: signatureBucketError } = await supabaseServer.storage.createBucket("signatures", {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/png", "image/jpeg"],
    })

    return NextResponse.json({
      success: true,
      message: "Database and storage buckets set up successfully",
    })
  } catch (error) {
    console.error("Error setting up database:", error)
    return NextResponse.json({ error: "Failed to set up database" }, { status: 500 })
  }
}

