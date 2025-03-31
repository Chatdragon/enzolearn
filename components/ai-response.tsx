"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Copy, Check, VolumeIcon as VolumeUp, Bookmark, BookmarkCheck } from "lucide-react"
import { aiApi } from "@/lib/api"
import { useStore } from "@/lib/store"
import type { AIResponse } from "@/lib/types"
import ReactMarkdown from "react-markdown"

interface AIResponseProps {
  response: string
  prompt: string
  type: "flashcard" | "summary" | "tutor"
  collectionId?: string
  onSave?: () => void
}

export function AIResponseCard({ response, prompt, type, collectionId, onSave }: AIResponseProps) {
  const [copied, setCopied] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const { addAIResponse } = useStore()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTextToSpeech = async () => {
    setAudioLoading(true)
    try {
      const result = await aiApi.textToSpeech(response)
      if (result.success && result.data) {
        const audio = new Audio(result.data.audio_url)
        audio.play()
      }
    } catch (error) {
      console.error("Error generating speech:", error)
    } finally {
      setAudioLoading(false)
    }
  }

  const saveResponse = () => {
    const aiResponse: AIResponse = {
      id: Date.now().toString(),
      user_id: "",
      prompt,
      response,
      type,
      created_at: new Date().toISOString(),
      collection_id: collectionId,
      saved: true,
    }

    addAIResponse(aiResponse)
    setSaved(true)
    if (onSave) onSave()
  }

  return (
    <Card className="overflow-hidden border-blue-200 dark:border-blue-900">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
      <CardContent className="p-4 pt-5">
        <div className="ai-response-header">
          <Sparkles className="h-4 w-4" />
          <span>
            {type === "summary" ? "AI Summary" : type === "flashcard" ? "Generated Flashcards" : "AI Response"}
          </span>
        </div>

        <div className="ai-response-content markdown-content">
          <ReactMarkdown>{response}</ReactMarkdown>
        </div>

        <div className="ai-response-actions">
          <Button variant="outline" size="sm" onClick={handleTextToSpeech} disabled={audioLoading}>
            {audioLoading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-1">◌</span>
                Processing
              </span>
            ) : (
              <>
                <VolumeUp className="h-4 w-4 mr-1" /> Listen
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={saveResponse} disabled={saved}>
            {saved ? (
              <>
                <BookmarkCheck className="h-4 w-4 mr-1" /> Saved
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4 mr-1" /> Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

