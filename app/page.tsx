import Dashboard from "@/components/Dashboard"

export default function Home() {
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">PDF Signing Dashboard</h1>
        <p className="text-gray-600">Upload, share, and manage PDF documents for digital signing</p>
      </div>
      <Dashboard />
    </div>
  )
}

