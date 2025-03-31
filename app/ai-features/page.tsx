"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { aiApi, collectionsApi } from "@/lib/api"
import { useStore } from "@/lib/store"
import { AIResponseCard } from "@/components/ai-response"
import { FlashcardItem } from "@/components/flashcard-item"
import { Sparkles, FileText, MessageSquare, Save, Loader2, Upload, Lightbulb, BookOpen, Brain } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function AIFeatures() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const { collections, setCollections, setLoading, isLoading } = useStore()

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "flashcards")
  const [inputText, setInputText] = useState("")
  const [selectedCollection, setSelectedCollection] = useState("")
  const [aiResponse, setAiResponse] = useState<any>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTips, setShowTips] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true)
      try {
        const response = await collectionsApi.getCollections()
        if (response.success && response.data) {
          setCollections(response.data)
        }
      } catch (error) {
        console.error("Error fetching collections:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchCollections()
    }
  }, [user, setCollections, setLoading])

  const handleGenerateFlashcards = async () => {
    if (!inputText.trim()) return

    setProcessing(true)
    setError(null)
    setAiResponse(null)

    try {
      const response = await aiApi.generateFlashcards(inputText, selectedCollection || undefined)

      if (response.success && response.data) {
        setAiResponse(response.data.flashcards)
      } else {
        setError(response.error || "Failed to generate flashcards")
      }
    } catch (error) {
      console.error("Error generating flashcards:", error)
      setError("An unexpected error occurred")
    } finally {
      setProcessing(false)
    }
  }

  const handleSummarizeText = async () => {
    if (!inputText.trim()) return

    setProcessing(true)
    setError(null)
    setAiResponse(null)

    try {
      const response = await aiApi.summarizeText(inputText)

      if (response.success && response.data) {
        setAiResponse(response.data.summary)
      } else {
        setError(response.error || "Failed to summarize text")
      }
    } catch (error) {
      console.error("Error summarizing text:", error)
      setError("An unexpected error occurred")
    } finally {
      setProcessing(false)
    }
  }

  const handleAskQuestion = async () => {
    if (!inputText.trim()) return

    setProcessing(true)
    setError(null)
    setAiResponse(null)

    try {
      const response = await aiApi.askQuestion(inputText)

      if (response.success && response.data) {
        setAiResponse(response.data.answer)
      } else {
        setError(response.error || "Failed to get an answer")
      }
    } catch (error) {
      console.error("Error asking question:", error)
      setError("An unexpected error occurred")
    } finally {
      setProcessing(false)
    }
  }

  const handleSaveFlashcards = async () => {
    if (!aiResponse) return

    setProcessing(true)
    setError(null)

    try {
      const response = await collectionsApi.createCollection({
        title: aiResponse.title,
        description: "Generated from AI",
        user_id: user?.id,
      })

      if (response.success && response.data) {
        // Redirect to the new collection
        router.push(`/study-collections/${response.data.id}`)
      } else {
        setError(response.error || "Failed to save flashcards")
      }
    } catch (error) {
      console.error("Error saving flashcards:", error)
      setError("An unexpected error occurred")
    } finally {
      setProcessing(false)
    }
  }

  const renderTips = () => {
    if (!showTips) return null

    const tips = {
      flashcards: [
        "Include key terms and definitions in your text",
        "Provide clear, concise information for better flashcards",
        "Add examples to help with understanding concepts",
        "Structure your content with headings and bullet points",
      ],
      summarize: [
        "Longer texts will generate more comprehensive summaries",
        "Include the most important information you want summarized",
        "Academic or technical content works well with the summarizer",
        "Try summarizing your study notes before an exam",
      ],
      tutor: [
        "Ask specific questions for more precise answers",
        "Provide context if your question relates to specific material",
        "Try asking 'Explain [concept] in simple terms'",
        "Ask follow-up questions to dive deeper into a topic",
      ],
    }

    return (
      <Card className="mb-6 border-blue-200 dark:border-blue-900">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
              Tips for better results
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowTips(false)}>
              Hide
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {tips[activeTab as keyof typeof tips].map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    )
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <MainNav />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">AI Features</h1>
            <p className="text-muted-foreground mt-1">Enhance your learning with AI-powered tools</p>
          </header>

          <Tabs defaultValue="flashcards" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid grid-cols-3 md:w-[400px]">
              <TabsTrigger value="flashcards" className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="summarize" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Summarize
              </TabsTrigger>
              <TabsTrigger value="tutor" className="flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                AI Tutor
              </TabsTrigger>
            </TabsList>

            {renderTips()}

            <TabsContent value="flashcards" className="space-y-6">
              <Card className="border-blue-100 dark:border-blue-900/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Generate Flashcards</CardTitle>
                  <CardDescription>Enter your study material and let AI generate flashcards for you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Enter your study material here..."
                      className="min-h-[200px] resize-y"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Save to collection (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="mr-2">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Upload a document (coming soon)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      variant="outline"
                      onClick={() => setInputText("")}
                      disabled={!inputText.trim() || processing}
                    >
                      Clear
                    </Button>
                  </div>
                  <Button
                    onClick={handleGenerateFlashcards}
                    disabled={!inputText.trim() || processing}
                    className="relative overflow-hidden group"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Flashcards
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {error && (
                <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
                  {error}
                </div>
              )}

              {aiResponse && activeTab === "flashcards" && (
                <div className="space-y-6">
                  <Card className="border-blue-100 dark:border-blue-900/50 shadow-sm">
                    <CardHeader>
                      <CardTitle>Generated Flashcards</CardTitle>
                      <CardDescription>{aiResponse.cards?.length || 0} flashcards generated</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {aiResponse.cards?.length > 0 && (
                        <div className="border rounded-lg p-4">
                          <FlashcardItem flashcard={aiResponse.cards[0]} showControls={false} />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {aiResponse.cards?.slice(1, 5).map((card: any, index: number) => (
                          <Card key={index} className="p-4">
                            <div className="font-medium mb-2">Question:</div>
                            <p className="mb-4">{card.question}</p>
                            <div className="font-medium mb-2">Answer:</div>
                            <p>{card.answer}</p>
                          </Card>
                        ))}
                      </div>

                      {aiResponse.cards?.length > 5 && (
                        <p className="text-center text-sm text-muted-foreground">
                          + {aiResponse.cards.length - 5} more flashcards
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleSaveFlashcards} disabled={processing} className="ml-auto">
                        {processing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Flashcards
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="summarize" className="space-y-6">
              <Card className="border-blue-100 dark:border-blue-900/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Summarize Text</CardTitle>
                  <CardDescription>Enter your text and get a concise summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Enter the text you want to summarize..."
                      className="min-h-[200px] resize-y"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="mr-2">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Upload a document (coming soon)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      variant="outline"
                      onClick={() => setInputText("")}
                      disabled={!inputText.trim() || processing}
                    >
                      Clear
                    </Button>
                  </div>
                  <Button onClick={handleSummarizeText} disabled={!inputText.trim() || processing}>
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Summarizing...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Summarize
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {error && (
                <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
                  {error}
                </div>
              )}

              {aiResponse && activeTab === "summarize" && (
                <AIResponseCard
                  response={aiResponse}
                  prompt={inputText}
                  type="summary"
                  collectionId={selectedCollection}
                />
              )}
            </TabsContent>

            <TabsContent value="tutor" className="space-y-6">
              <Card className="border-blue-100 dark:border-blue-900/50 shadow-sm">
                <CardHeader>
                  <CardTitle>AI Tutoring</CardTitle>
                  <CardDescription>Ask questions about your study materials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Ask a question about your study materials..."
                      className="min-h-[150px] resize-y"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setInputText("")} disabled={!inputText.trim() || processing}>
                    Clear
                  </Button>
                  <Button onClick={handleAskQuestion} disabled={!inputText.trim() || processing}>
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Ask Question
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>

              {error && (
                <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
                  {error}
                </div>
              )}

              {aiResponse && activeTab === "tutor" && (
                <AIResponseCard
                  response={aiResponse}
                  prompt={inputText}
                  type="tutor"
                  collectionId={selectedCollection}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

