import type {
  ApiResponse,
  LoginCredentials,
  RegisterCredentials,
  Collection,
  StudyItem,
  FlashcardSet,
  User,
} from "@/lib/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Helper function for making API requests
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const url = `${API_URL}${endpoint}`
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    // Add token from localStorage if it exists
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    console.log(`Fetching ${url}...`)

    const response = await fetch(url, { ...options, headers })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong")
    }

    return data
  } catch (error) {
    console.error("API Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) =>
    fetchApi<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (credentials: RegisterCredentials) =>
    fetchApi<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    fetchApi("/auth/logout", {
      method: "POST",
    }),

  forgotPassword: (email: string) =>
    fetchApi("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    fetchApi("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  getUser: () => fetchApi<User>("/auth/user"),

  updateUser: (data: Partial<User>) =>
    fetchApi<User>("/auth/user", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
}

// Collections API
export const collectionsApi = {
  getCollections: () => fetchApi<Collection[]>("/collections"),

  getCollection: (id: string) => fetchApi<Collection>(`/collections/${id}`),

  createCollection: (data: Partial<Collection>) =>
    fetchApi<Collection>("/collections", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCollection: (id: string, data: Partial<Collection>) =>
    fetchApi<Collection>(`/collections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCollection: (id: string) =>
    fetchApi(`/collections/${id}`, {
      method: "DELETE",
    }),
}

// Study Items API
export const studyItemsApi = {
  getStudyItems: (collectionId: string) => fetchApi<StudyItem[]>(`/collections/${collectionId}/items`),

  getStudyItem: (id: string) => fetchApi<StudyItem>(`/study-items/${id}`),

  createStudyItem: (data: Partial<StudyItem>) =>
    fetchApi<StudyItem>("/study-items", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStudyItem: (id: string, data: Partial<StudyItem>) =>
    fetchApi<StudyItem>(`/study-items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteStudyItem: (id: string) =>
    fetchApi(`/study-items/${id}`, {
      method: "DELETE",
    }),

  generateAudio: (id: string) =>
    fetchApi<{ audio_url: string }>(`/study-items/${id}/audio`, {
      method: "POST",
    }),
}

// Flashcards API
export const flashcardsApi = {
  getFlashcardSets: (collectionId?: string) =>
    fetchApi<FlashcardSet[]>(collectionId ? `/collections/${collectionId}/flashcards` : "/flashcards"),

  getFlashcardSet: (id: string) => fetchApi<FlashcardSet>(`/flashcards/${id}`),

  createFlashcardSet: (data: Partial<FlashcardSet>) =>
    fetchApi<FlashcardSet>("/flashcards", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateFlashcardSet: (id: string, data: Partial<FlashcardSet>) =>
    fetchApi<FlashcardSet>(`/flashcards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteFlashcardSet: (id: string) =>
    fetchApi(`/flashcards/${id}`, {
      method: "DELETE",
    }),
}

// AI Features API
export const aiApi = {
  generateFlashcards: (text: string, collectionId?: string) =>
    fetchApi<{ flashcards: FlashcardSet }>("/ai/flashcards", {
      method: "POST",
      body: JSON.stringify({ text, collection_id: collectionId }),
    }),

  summarizeText: (text: string) =>
    fetchApi<{ summary: string }>("/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  askQuestion: (question: string, context?: string) =>
    fetchApi<{ answer: string }>("/ai/tutor", {
      method: "POST",
      body: JSON.stringify({ question, context }),
    }),

  textToSpeech: (text: string) =>
    fetchApi<{ audio_url: string }>("/ai/text-to-speech", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
}

// Activity API
export const activityApi = {
  getRecentActivity: () => fetchApi<any[]>("/activity"),
}

