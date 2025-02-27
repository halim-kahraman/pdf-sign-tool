"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, FileText, Calendar, User } from "lucide-react"
import Image from "next/image"

export default function ViewSignedDocument() {
  const { id } = useParams()
  const [document, setDocument] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const { data, error } = await supabase.from("documents").select("*").eq("id", id).single()

        if (error) throw error
        setDocument(data)
      } catch (error) {
        console.error("Error fetching document:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchDocument()
    }
  }, [id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Document Not Found</h1>
        <p>The document you are looking for does not exist or has been removed.</p>
      </div>
    )
  }

  if (document.status !== "Signed") {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Document Not Signed</h1>
        <p>This document has not been signed yet.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Signed Document</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Document Name</p>
                  <p className="text-gray-600">{document.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Signed By</p>
                  <p className="text-gray-600">{document.shared_with || "Unknown"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">Signed At</p>
                  <p className="text-gray-600">{formatDate(document.signed_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {document.signature_url ? (
              <div className="border border-gray-200 rounded-md p-4 bg-white">
                <Image
                  src={document.signature_url || "/placeholder.svg"}
                  alt="Signature"
                  width={400}
                  height={200}
                  className="max-w-full h-auto"
                />
              </div>
            ) : (
              <p className="text-gray-600">Signature not available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Document Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <iframe
            src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(document.url)}`}
            className="w-full h-[600px] border-0"
            title="PDF Viewer"
          />
        </CardContent>
      </Card>
    </div>
  )
}

