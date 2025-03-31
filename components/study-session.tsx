"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { FlashcardItem } from "@/components/flashcard-item"
import type { Flashcard, FlashcardSet } from "@/lib/types"
import { Clock, Save, RotateCcw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface StudySessionProps {
  flashcardSet: FlashcardSet
  onComplete?: (results: StudySessionResults) => void
  onExit?: () => void
}

export interface StudySessionResults {
  totalCards: number
  correctCount: number
  incorrectCount: number
  skippedCount: number
  duration: number
  date: string
}

export function StudySession({ flashcardSet, onComplete, onExit }: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [results, setResults] = useState<{
    correct: string[]
    incorrect: string[]
    skipped: string[]
  }>({
    correct: [],
    incorrect: [],
    skipped: [],
  })
  const [isComplete, setIsComplete] = useState(false)
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([])

  useEffect(() => {
    // Shuffle cards for the study session
    const shuffled = [...flashcardSet.cards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
    setStartTime(Date.now())
  }, [flashcardSet])

  const handleNext = () => {
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      completeSession()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleMarkCorrect = (id: string) => {
    setResults((prev) => ({
      ...prev,
      correct: [...prev.correct, id],
      incorrect: prev.incorrect.filter((cardId) => cardId !== id),
      skipped: prev.skipped.filter((cardId) => cardId !== id),
    }))
  }

  const handleMarkIncorrect = (id: string) => {
    setResults((prev) => ({
      ...prev,
      incorrect: [...prev.incorrect, id],
      correct: prev.correct.filter((cardId) => cardId !== id),
      skipped: prev.skipped.filter((cardId) => cardId !== id),
    }))
  }

  const handleSkip = () => {
    const currentCardId = shuffledCards[currentIndex].id
    if (!results.correct.includes(currentCardId) && !results.incorrect.includes(currentCardId)) {
      setResults((prev) => ({
        ...prev,
        skipped: [...prev.skipped, currentCardId],
      }))
    }
    handleNext()
  }

  const completeSession = () => {
    const endTime = Date.now()
    const duration = endTime - startTime

    const sessionResults: StudySessionResults = {
      totalCards: shuffledCards.length,
      correctCount: results.correct.length,
      incorrectCount: results.incorrect.length,
      skippedCount: results.skipped.length,
      duration,
      date: new Date().toISOString(),
    }

    setIsComplete(true)

    if (onComplete) {
      onComplete(sessionResults)
    }
  }

  const restartSession = () => {
    setCurrentIndex(0)
    setResults({
      correct: [],
      incorrect: [],
      skipped: [],
    })
    setIsComplete(false)
    setStartTime(Date.now())

    // Reshuffle cards
    const shuffled = [...flashcardSet.cards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
  }

  if (shuffledCards.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p>No flashcards available in this set.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isComplete) {
    const totalAnswered = results.correct.length + results.incorrect.length
    const accuracy = totalAnswered > 0 ? (results.correct.length / totalAnswered) * 100 : 0
    const duration = Date.now() - startTime

    return (
      <Card>
        <CardHeader>
          <CardTitle>Study Session Complete</CardTitle>
          <CardDescription>You've completed studying "{flashcardSet.title}"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-3xl font-bold">{results.correct.length}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-3xl font-bold">{results.incorrect.length}</div>
              <div className="text-sm text-muted-foreground">Incorrect</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-3xl font-bold">{results.skipped.length}</div>
              <div className="text-sm text-muted-foreground">Skipped</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-3xl font-bold">{Math.round(accuracy)}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Study Duration</span>
              <span>{formatDistanceToNow(Date.now() - duration, { includeSeconds: true })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cards Studied</span>
              <span>{shuffledCards.length}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onExit}>
            Exit
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={restartSession}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Study Again
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Results
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  }

  const progress = ((currentIndex + 1) / shuffledCards.length) * 100

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">{flashcardSet.title}</h3>
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {shuffledCards.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(startTime, { includeSeconds: true })}
          </span>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <FlashcardItem
        flashcard={shuffledCards[currentIndex]}
        onNext={handleNext}
        onPrevious={currentIndex > 0 ? handlePrevious : undefined}
        onMarkCorrect={handleMarkCorrect}
        onMarkIncorrect={handleMarkIncorrect}
      />

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onExit}>
          Exit Session
        </Button>
        <Button variant="outline" onClick={handleSkip}>
          Skip
        </Button>
      </div>
    </div>
  )
}

