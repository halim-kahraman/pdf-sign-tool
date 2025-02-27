import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { email, documentId, documentName } = await request.json()

    if (!email || !documentId) {
      return NextResponse.json({ error: "Email and document ID are required" }, { status: 400 })
    }

    // Get document details from Supabase
    const { data: document, error: docError } = await supabaseServer
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Create a signing link
    const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign/${documentId}`

    // Set up email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Send email
    await transporter.sendMail({
      from: `"Document Signing" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Document for Signing: ${documentName || "Document"}`,
      text: `Please sign the document at: ${signingUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Document Signing Request</h2>
          <p>You have received a document that requires your signature.</p>
          <p><strong>Document:</strong> ${documentName || "Document"}</p>
          <p>Please click the button below to view and sign the document:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signingUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View & Sign Document
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p>${signingUrl}</p>
          <p>This link will expire in 7 days.</p>
        </div>
      `,
    })

    // Update document status in database
    await supabaseServer
      .from("documents")
      .update({
        status: "Shared",
        shared_with: email,
        shared_at: new Date().toISOString(),
      })
      .eq("id", documentId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sharing document:", error)
    return NextResponse.json({ error: "Failed to share document" }, { status: 500 })
  }
}

