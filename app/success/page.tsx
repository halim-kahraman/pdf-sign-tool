"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const documentId = searchParams.get("id")
  const [documentName, setDocumentName] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocumentName = async () => {
      if (documentId) {
        const { data } = await supabase.from("documents").select("name").eq("id", documentId).single()

        if (data) {
          setDocumentName(data.name)
        }
      }
    }

    fetchDocumentName()
  }, [documentId])

  return (
    <div className="container mx-auto p-4 max-w-md text-center">
      <div className="py-12 space-y-6">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />

        <h1 className="text-2xl font-bold">Document Signed Successfully!</h1>

        {documentName && (
          <p className="text-gray-600">
            You have successfully signed the document: <strong>{documentName}</strong>
          </p>
        )}

        <p className="text-gray-600">
          The document has been securely signed with a timestamp and sent back to the sender.
        </p>

        <div className="pt-4">
          <Button onClick={() => window.close()}>Close Window</Button>
        </div>
      </div>
    </div>
  )
}

