import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PDF Signing App",
  description: "Securely share and sign PDF documents",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b">
            <div className="container mx-auto p-4">
              <h1 className="text-xl font-bold">PDF Signing App</h1>
            </div>
          </header>
          <main>{children}</main>
          <Toaster />
        </div>
      </body>
    </html>
  )
}



import './globals.css'