"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Loader2 } from "lucide-react"

export default function SignDocument() {
  const { id } = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const signaturePadRef = useRef<SignatureCanvas>(null)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const { data, error } = await supabase.from("documents").select("*").eq("id", id).single()

        if (error) throw error

        if (data.status === "Signed") {
          toast({
            title: "Document already signed",
            description: "This document has already been signed.",
            variant: "destructive",
          })
          setTimeout(() => {
            router.push("/")
          }, 3000)
          return
        }

        setDocument(data)
      } catch (error) {
        console.error("Error fetching document:", error)
        toast({
          title: "Error",
          description: "Failed to load document",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchDocument()
    }
  }, [id, router])

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
    }
  }

  const handleSign = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      toast({
        title: "Signature required",
        description: "Please provide your signature before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSigning(true)
    try {
      const signatureData = signaturePadRef.current.toDataURL("image/png")
      const timestamp = new Date().toISOString()

      // Upload signature to Supabase Storage
      const signatureFileName = `signature_${id}_${Date.now()}.png`
      const { error: uploadError } = await supabase.storage
        .from("signatures")
        .upload(signatureFileName, dataURLtoBlob(signatureData))

      if (uploadError) throw uploadError

      // Get public URL for the signature
      const { data: signatureUrl } = supabase.storage.from("signatures").getPublicUrl(signatureFileName)

      // Update document status in the database
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          status: "Signed",
          signed_at: timestamp,
          signature_path: signatureFileName,
          signature_url: signatureUrl.publicUrl,
        })
        .eq("id", id)

      if (updateError) throw updateError

      toast({
        title: "Success",
        description: "Document signed successfully!",
      })

      // Redirect to success page after a short delay
      setTimeout(() => {
        router.push(`/success?id=${id}`)
      }, 2000)
    } catch (error) {
      console.error("Error signing document:", error)
      toast({
        title: "Error",
        description: "Failed to sign document",
        variant: "destructive",
      })
    } finally {
      setIsSigning(false)
    }
  }

  // Helper function to convert dataURL to Blob
  const dataURLtoBlob = (dataURL: string) => {
    const arr = dataURL.split(",")
    const mime = arr[0].match(/:(.*?);/)![1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Sign Document</h1>

      <Card className="mb-6">
        <CardContent className="p-0">
          <iframe
            src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(document.url)}`}
            className="w-full h-[600px] border-0"
            title="PDF Viewer"
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Signature</h2>
        <p className="text-sm text-gray-500">Please sign below using your mouse or finger on touch devices.</p>

        <div className="border border-gray-300 rounded-md bg-white">
          <SignatureCanvas
            ref={signaturePadRef}
            canvasProps={{
              className: "w-full h-64",
            }}
            backgroundColor="white"
          />
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={clearSignature}>
            Clear
          </Button>
          <Button onClick={handleSign} disabled={isSigning}>
            {isSigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing...
              </>
            ) : (
              "Sign and Submit"
            )}
          </Button>
        </div>
      </div>

      <Toaster />
    </div>
  )
}

