import mammoth from 'mammoth'

const MAX_CHARS = 120_000
const CHUNK_SIZE = 12_000

export interface ExtractedTextResult {
  text: string
  chunks: string[]
  truncated: boolean
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\u0000/g, '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim()
}

function toChunks(text: string): string[] {
  if (!text) return []
  const out: string[] = []
  for (let i = 0; i < text.length; i += CHUNK_SIZE) out.push(text.slice(i, i + CHUNK_SIZE))
  return out
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const mod = await import('pdf-parse')
  const parser = new mod.PDFParse({ data: buffer })
  try {
    const parsed = await parser.getText()
    return parsed.text ?? ''
  } finally {
    await parser.destroy()
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const res = await mammoth.extractRawText({ buffer })
  return res.value ?? ''
}

function extractUtf8(buffer: Buffer): string {
  return buffer.toString('utf8')
}

export async function extractTextFromFile(
  fileName: string,
  mimeType: string,
  arrayBuffer: ArrayBuffer
): Promise<ExtractedTextResult> {
  const ext = fileName.toLowerCase().split('.').pop() ?? ''
  const buffer = Buffer.from(arrayBuffer)

  try {
    let raw = ''
    if (mimeType === 'application/pdf' || ext === 'pdf') {
      raw = await extractPdf(buffer)
    } else if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === 'docx'
    ) {
      raw = await extractDocx(buffer)
    } else if (
      mimeType.startsWith('text/') ||
      ext === 'txt' ||
      ext === 'md' ||
      ext === 'markdown'
    ) {
      raw = extractUtf8(buffer)
    } else {
      throw new Error('Unsupported file type. Use PDF, TXT, DOCX, or MD.')
    }

    const normalized = normalizeWhitespace(raw)
    const truncated = normalized.length > MAX_CHARS
    const text = truncated ? normalized.slice(0, MAX_CHARS) : normalized

    if (!text) throw new Error('Could not extract readable text from this file.')
    return { text, chunks: toChunks(text), truncated }
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : 'Failed to parse file. It may be corrupted or unsupported.'
    throw new Error(msg)
  }
}

