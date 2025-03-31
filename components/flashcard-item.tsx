"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Flashcard } from "@/lib/types"
import { Rotate3D, ArrowLeft, ArrowRight, Check, X } from "lucide-react"

interface FlashcardItemProps {
  flashcard: Flashcard
  onNext?: () => void
  onPrevious?: () => void
  onMarkCorrect?: (id: string) => void
  onMarkIncorrect?: (id: string) => void
  showControls?: boolean
}

export function FlashcardItem({
  flashcard,
  onNext,
  onPrevious,
  onMarkCorrect,
  onMarkIncorrect,
  showControls = true,
}: FlashcardItemProps) {
  const [flipped, setFlipped] = useState(false)

  const toggleFlip = () => {
    setFlipped(!flipped)
  }

  const handleMarkCorrect = () => {
    if (onMarkCorrect) {
      onMarkCorrect(flashcard.id)
    }
    if (onNext) {
      onNext()
    }
  }

  const handleMarkIncorrect = () => {
    if (onMarkIncorrect) {
      onMarkIncorrect(flashcard.id)
    }
    if (onNext) {
      onNext()
    }
  }

  return (
    <div className="w-full h-[300px] md:h-[400px]">
      <div className={`flashcard h-full ${flipped ? "flipped" : ""}`}>
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <Card className="w-full h-full flex flex-col p-6 shadow-md">
              <div className="flex-1 flex items-center justify-center">
                <h3 className="text-xl font-medium text-center">{flashcard.question}</h3>
              </div>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={toggleFlip}>
                  <Rotate3D className="h-4 w-4 mr-2" />
                  Flip to see answer
                </Button>
              </div>
            </Card>
          </div>
          <div className="flashcard-back">
            <Card className="w-full h-full flex flex-col p-6 shadow-md">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-lg text-center">{flashcard.answer}</div>
              </div>
              <div className="mt-4 flex justify-center gap-2">
                <Button variant="outline" onClick={toggleFlip}>
                  <Rotate3D className="h-4 w-4 mr-2" />
                  Flip to question
                </Button>
              </div>

              {showControls && (
                <div className="mt-4 flex justify-between">
                  <div className="flex gap-2">
                    {onPrevious && (
                      <Button variant="ghost" size="sm" onClick={onPrevious}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                    )}
                  </div>

                  {(onMarkCorrect || onMarkIncorrect) && (
                    <div className="flex gap-2">
                      {onMarkIncorrect && (
                        <Button variant="outline" size="sm" className="text-red-500" onClick={handleMarkIncorrect}>
                          <X className="h-4 w-4 mr-1" />
                          Incorrect
                        </Button>
                      )}
                      {onMarkCorrect && (
                        <Button variant="outline" size="sm" className="text-green-500" onClick={handleMarkCorrect}>
                          <Check className="h-4 w-4 mr-1" />
                          Correct
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {onNext && (
                      <Button variant="ghost" size="sm" onClick={onNext}>
                        Next
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

