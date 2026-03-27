export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar / nav will go here */}
      <main className="container mx-auto py-8">{children}</main>
    </div>
  )
}
