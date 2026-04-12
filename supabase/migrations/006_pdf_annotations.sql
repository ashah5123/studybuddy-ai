-- PDF Annotator: documents and per-annotation highlights.

CREATE TABLE IF NOT EXISTS public.pdf_documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id   UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  name        TEXT        NOT NULL,
  file_url    TEXT        NOT NULL,
  file_size   BIGINT,
  page_count  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdf_annotations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID        NOT NULL REFERENCES public.pdf_documents(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_number     INTEGER     NOT NULL,
  selected_text   TEXT        NOT NULL,
  note            TEXT,
  color           TEXT        NOT NULL DEFAULT 'yellow'
                              CHECK (color IN ('yellow','green','blue','pink','purple')),
  -- position_data stores percentage-based rects relative to the rendered page:
  -- { "rects": [{ "top": %, "left": %, "width": %, "height": % }, ...] }
  position_data   JSONB,
  ai_explanation  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdf_documents_user
  ON public.pdf_documents (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pdf_annotations_document
  ON public.pdf_annotations (document_id, page_number);

CREATE INDEX IF NOT EXISTS idx_pdf_annotations_user
  ON public.pdf_annotations (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_pdf_documents_updated_at ON public.pdf_documents;
CREATE TRIGGER trg_pdf_documents_updated_at
  BEFORE UPDATE ON public.pdf_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_pdf_annotations_updated_at ON public.pdf_annotations;
CREATE TRIGGER trg_pdf_annotations_updated_at
  BEFORE UPDATE ON public.pdf_annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.pdf_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pdf_documents_select" ON public.pdf_documents;
DROP POLICY IF EXISTS "pdf_documents_insert" ON public.pdf_documents;
DROP POLICY IF EXISTS "pdf_documents_update" ON public.pdf_documents;
DROP POLICY IF EXISTS "pdf_documents_delete" ON public.pdf_documents;

CREATE POLICY "pdf_documents_select" ON public.pdf_documents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "pdf_documents_insert" ON public.pdf_documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "pdf_documents_update" ON public.pdf_documents FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "pdf_documents_delete" ON public.pdf_documents FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pdf_annotations_select" ON public.pdf_annotations;
DROP POLICY IF EXISTS "pdf_annotations_insert" ON public.pdf_annotations;
DROP POLICY IF EXISTS "pdf_annotations_update" ON public.pdf_annotations;
DROP POLICY IF EXISTS "pdf_annotations_delete" ON public.pdf_annotations;

CREATE POLICY "pdf_annotations_select"
  ON public.pdf_annotations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "pdf_annotations_insert"
  ON public.pdf_annotations FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pdf_documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "pdf_annotations_update"
  ON public.pdf_annotations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pdf_annotations_delete"
  ON public.pdf_annotations FOR DELETE
  USING (user_id = auth.uid());
