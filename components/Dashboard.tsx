"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

type Document = {
  id: string
  name: string
  status: string
  created_at: string
  url?: string
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [recipientEmail, setRecipientEmail] = useState("")

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from("pdfs").upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from("pdfs").getPublicUrl(fileName)

      // Insert record in the documents table
      const { data, error: dbError } = await supabase
        .from("documents")
        .insert({
          name: file.name,
          status: "Uploaded",
          file_path: fileName,
          url: urlData.publicUrl,
        })
        .select()

      if (dbError) throw dbError

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      })

      fetchDocuments()
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      // Reset file input
      event.target.value = ""
    }
  }

  const openShareDialog = (docId: string) => {
    setSelectedDocId(docId)
    setIsShareDialogOpen(true)
  }

  const handleShare = async () => {
    if (!selectedDocId || !recipientEmail) return

    setIsLoading(true)
    try {
      const selectedDoc = documents.find((doc) => doc.id === selectedDocId)

      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: recipientEmail,
          documentId: selectedDocId,
          documentName: selectedDoc?.name,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to share document")
      }

      // Update document status
      const { error } = await supabase.from("documents").update({ status: "Shared" }).eq("id", selectedDocId)

      if (error) throw error

      toast({
        title: "Success",
        description: `Document shared with ${recipientEmail}`,
      })

      setIsShareDialogOpen(false)
      setRecipientEmail("")
      fetchDocuments()
    } catch (error) {
      console.error("Error sharing document:", error)
      toast({
        title: "Error",
        description: "Failed to share document",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input type="file" accept=".pdf" onChange={handleFileUpload} disabled={isLoading} />
        <Button onClick={fetchDocuments} variant="outline">
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No documents found. Upload a PDF to get started.
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>{doc.name}</TableCell>
                <TableCell>{formatDate(doc.created_at)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      doc.status === "Signed"
                        ? "bg-green-100 text-green-800"
                        : doc.status === "Shared"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {doc.status}
                  </span>
                </TableCell>
                <TableCell>
                  {doc.status === "Uploaded" && (
                    <Button onClick={() => openShareDialog(doc.id)} size="sm" disabled={isLoading}>
                      Share
                    </Button>
                  )}
                  {doc.status === "Signed" && (
                    <Button onClick={() => window.open(`/view/${doc.id}`, "_blank")} size="sm" variant="outline">
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleShare} disabled={isLoading || !recipientEmail}>
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

