/**
 * Records audio from the microphone and transcribes it via the Groq Whisper
 * API (proxied through /api/transcribe to keep the key server-side).
 *
 * Usage:
 *   const recorder = createAudioRecorder()
 *   await recorder.start()
 *   // ... later ...
 *   const text = await recorder.stopAndTranscribe()
 */

export interface AudioRecorder {
  start: () => Promise<void>
  stopAndTranscribe: () => Promise<string>
  cancel: () => void
  readonly isRecording: boolean
}

export function createAudioRecorder(): AudioRecorder {
  let mediaRecorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let stream: MediaStream | null = null
  let recording = false

  return {
    get isRecording() {
      return recording
    },

    async start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks = []

      // Prefer webm/opus; fall back to whatever the browser supports
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''

      mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      mediaRecorder.start(100) // collect chunks every 100ms
      recording = true
    },

    stopAndTranscribe(): Promise<string> {
      return new Promise((resolve, reject) => {
        if (!mediaRecorder || !recording) {
          resolve('')
          return
        }

        mediaRecorder.onstop = async () => {
          recording = false
          stream?.getTracks().forEach((t) => t.stop())
          stream = null

          if (chunks.length === 0) {
            resolve('')
            return
          }

          const blob = new Blob(chunks, { type: mediaRecorder?.mimeType ?? 'audio/webm' })
          chunks = []

          try {
            const form = new FormData()
            form.append('audio', blob, 'audio.webm')
            const res = await fetch('/api/transcribe', { method: 'POST', body: form })
            const data = (await res.json()) as { text?: string; error?: string }
            if (!res.ok) throw new Error(data.error ?? 'Transcription failed')
            resolve(data.text ?? '')
          } catch (err) {
            reject(err)
          }
        }

        mediaRecorder.stop()
      })
    },

    cancel() {
      if (mediaRecorder && recording) {
        mediaRecorder.onstop = null
        mediaRecorder.stop()
      }
      stream?.getTracks().forEach((t) => t.stop())
      stream = null
      chunks = []
      recording = false
    },
  }
}
