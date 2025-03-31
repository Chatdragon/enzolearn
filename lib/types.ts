// User types
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  last_login?: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  theme?: "light" | "dark"
  emailNotifications?: boolean
  studyReminders?: boolean
}

// Collection types
export interface Collection {
  id: string
  user_id: string
  title: string
  description?: string
  color?: string
  icon?: string
  created_at: string
  updated_at: string
  item_count?: number
}

// Study item types
export type StudyItemType = "note" | "flashcard" | "quiz"

export interface StudyItem {
  id: string
  collection_id: string
  user_id: string
  type: StudyItemType
  title: string
  content: string
  tags?: string[]
  created_at: string
  updated_at: string
  last_studied?: string
  study_count?: number
  audio_url?: string
}

// Flashcard types
export interface Flashcard {
  id: string
  question: string
  answer: string
  tags?: string[]
  difficulty?: "easy" | "medium" | "hard"
  last_reviewed?: string
  next_review?: string
  review_count?: number
}

export interface FlashcardSet {
  id: string
  user_id: string
  collection_id?: string
  title: string
  description?: string
  cards: Flashcard[]
  created_at: string
  updated_at: string
  last_studied?: string
  study_count?: number
}

// Quiz types
export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

export interface Quiz {
  id: string
  user_id: string
  collection_id: string
  title: string
  description?: string
  questions: QuizQuestion[]
  created_at: string
  updated_at: string
  last_taken?: string
  take_count?: number
}

// AI response types
export interface AIResponse {
  id: string
  user_id: string
  prompt: string
  response: string
  type: "flashcard" | "summary" | "tutor"
  created_at: string
  collection_id?: string
  saved: boolean
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Activity types
export interface StudyActivity {
  id: string
  user_id: string
  activity_type: "study" | "create" | "edit" | "delete" | "ai_generate"
  item_type: "collection" | "note" | "flashcard" | "quiz"
  item_id: string
  item_title: string
  created_at: string
  duration?: number
}

// Auth types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
}

