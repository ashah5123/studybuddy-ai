import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export const geminiPro = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
