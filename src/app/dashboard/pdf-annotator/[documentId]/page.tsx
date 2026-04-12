import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PDFViewerClient } from '@/components/pdf/PDFViewerClient'
import type { Annotation } from '@/components/pdf/PDFViewerClient'

interface Props {
  params: Promise<{ documentId: string }>
}

export default async function PDFViewerPage({ params }: Props) {
  const { documentId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: doc } = await supabase
    .from('pdf_documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', user.id)
    .single()

  if (!doc) notFound()

  const { data: annotations } = await supabase
    .from('pdf_annotations')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', user.id)
    .order('page_number', { ascending: true })
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/pdf-annotator"
          className="flex items-center gap-1 text-sm text-[var(--sb-muted)] hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          PDF Annotator
        </Link>
        <span className="text-[var(--sb-muted)]">/</span>
        <span className="max-w-xs truncate text-sm font-medium text-white" title={doc.name}>
          {doc.name}
        </span>
      </div>

      <PDFViewerClient
        documentId={doc.id}
        documentName={doc.name}
        fileUrl={doc.file_url}
        initialAnnotations={(annotations ?? []) as Annotation[]}
      />
    </div>
  )
}
