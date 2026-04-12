'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Web Speech API types (not in default TS lib for all targets)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

export interface UseVoiceInputReturn {
  isSupported: boolean
  isListening: boolean
  transcript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  clearTranscript: () => void
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition ?? window.webkitSpeechRecognition)

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Web Speech API not supported in this browser.')
      return
    }
    setError(null)
    setTranscript('')

    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(final || interim)
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed') {
        setError('Microphone access denied. Allow microphone in browser settings.')
      } else if (e.error === 'no-speech') {
        setError('No speech detected. Try speaking closer to the microphone.')
      } else if (e.error !== 'aborted') {
        setError(`Speech recognition error: ${e.error}`)
      }
      setIsListening(false)
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isSupported])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const clearTranscript = useCallback(() => setTranscript(''), [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
  }
}
