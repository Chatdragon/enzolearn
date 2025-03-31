"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"
import { useStore } from "@/lib/store"
import type { User, LoginCredentials, RegisterCredentials } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, setUser } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      try {
        // Check if token exists in localStorage
        const token = localStorage.getItem("token")
        if (!token) {
          setIsLoading(false)
          return
        }

        const response = await authApi.getUser()
        if (response.success && response.data) {
          setUser(response.data)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [setUser])

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("Attempting login with:", credentials.email)
      const response = await authApi.login(credentials)

      if (response.success && response.data) {
        console.log("Login successful")
        setUser(response.data.user)
        localStorage.setItem("token", response.data.token)
        router.push("/")
      } else {
        console.error("Login failed:", response.error)
        setError(response.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Failed to connect to the server. Please make sure the backend is running.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.register(credentials)
      if (response.success && response.data) {
        setUser(response.data.user)
        localStorage.setItem("token", response.data.token)
        router.push("/")
      } else {
        setError(response.error || "Registration failed")
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to connect to the server. Please make sure the backend is running.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authApi.logout()
      setUser(null)
      localStorage.removeItem("token")
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (email: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.forgotPassword(email)
      if (!response.success) {
        setError(response.error || "Failed to send password reset email")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to connect to the server")
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (token: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.resetPassword(token, password)
      if (response.success) {
        router.push("/login")
      } else {
        setError(response.error || "Failed to reset password")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to connect to the server")
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = async (data: Partial<User>) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.updateUser(data)
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        setError(response.error || "Failed to update user")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to connect to the server")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

