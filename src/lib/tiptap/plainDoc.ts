/** Minimal TipTap-compatible JSON for storing plain text in `notes.content`. */
export function plainTextToDoc(text: string): Record<string, unknown> {
  const trimmed = text.trim()
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: trimmed ? [{ type: 'text', text: trimmed }] : [],
      },
    ],
  }
}

export function docToPlainPreview(content: Record<string, unknown> | null): string {
  if (!content || typeof content !== 'object') return ''
  try {
    const walk = (node: unknown): string => {
      if (!node || typeof node !== 'object') return ''
      const n = node as { type?: string; text?: string; content?: unknown[] }
      if (n.type === 'text' && typeof n.text === 'string') return n.text
      if (Array.isArray(n.content)) return n.content.map(walk).join('')
      return ''
    }
    return walk(content).slice(0, 200)
  } catch {
    return ''
  }
}
