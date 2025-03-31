import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Collection, StudyItem, User, FlashcardSet, AIResponse } from "@/lib/types"

interface EnzoLearnState {
  user: User | null
  collections: Collection[]
  currentCollection: Collection | null
  studyItems: StudyItem[]
  flashcardSets: FlashcardSet[]
  aiResponses: AIResponse[]
  recentActivity: any[]
  isLoading: boolean
  error: string | null
  darkMode: boolean

  // Auth actions
  setUser: (user: User | null) => void

  // Collections actions
  setCollections: (collections: Collection[]) => void
  addCollection: (collection: Collection) => void
  updateCollection: (id: string, data: Partial<Collection>) => void
  deleteCollection: (id: string) => void
  setCurrentCollection: (collection: Collection | null) => void

  // Study items actions
  setStudyItems: (items: StudyItem[]) => void
  addStudyItem: (item: StudyItem) => void
  updateStudyItem: (id: string, data: Partial<StudyItem>) => void
  deleteStudyItem: (id: string) => void

  // Flashcard sets actions
  setFlashcardSets: (sets: FlashcardSet[]) => void
  addFlashcardSet: (set: FlashcardSet) => void

  // AI responses actions
  addAIResponse: (response: AIResponse) => void

  // UI state actions
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  toggleDarkMode: () => void

  // Activity tracking
  addActivity: (activity: any) => void
  setRecentActivity: (activities: any[]) => void
}

export const useStore = create<EnzoLearnState>()(
  persist(
    (set) => ({
      user: null,
      collections: [],
      currentCollection: null,
      studyItems: [],
      flashcardSets: [],
      aiResponses: [],
      recentActivity: [],
      isLoading: false,
      error: null,
      darkMode: false,

      // Auth actions
      setUser: (user) => set({ user }),

      // Collections actions
      setCollections: (collections) => set({ collections }),
      addCollection: (collection) => set((state) => ({ collections: [...state.collections, collection] })),
      updateCollection: (id, data) =>
        set((state) => ({
          collections: state.collections.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteCollection: (id) =>
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
        })),
      setCurrentCollection: (collection) => set({ currentCollection: collection }),

      // Study items actions
      setStudyItems: (items) => set({ studyItems: items }),
      addStudyItem: (item) => set((state) => ({ studyItems: [...state.studyItems, item] })),
      updateStudyItem: (id, data) =>
        set((state) => ({
          studyItems: state.studyItems.map((item) => (item.id === id ? { ...item, ...data } : item)),
        })),
      deleteStudyItem: (id) =>
        set((state) => ({
          studyItems: state.studyItems.filter((item) => item.id !== id),
        })),

      // Flashcard sets actions
      setFlashcardSets: (sets) => set({ flashcardSets: sets }),
      addFlashcardSet: (set) => set((state) => ({ flashcardSets: [...state.flashcardSets, set] })),

      // AI responses actions
      addAIResponse: (response) => set((state) => ({ aiResponses: [...state.aiResponses, response] })),

      // UI state actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // Activity tracking
      addActivity: (activity) =>
        set((state) => ({
          recentActivity: [activity, ...state.recentActivity].slice(0, 10),
        })),
      setRecentActivity: (activities) => set({ recentActivity: activities }),
    }),
    {
      name: "enzolearn-storage",
      partialize: (state) => ({
        darkMode: state.darkMode,
        user: state.user,
      }),
    },
  ),
)

