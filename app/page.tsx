"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collectionsApi, activityApi, studyItemsApi } from "@/lib/api"
import { useStore } from "@/lib/store"
import {
  BookOpen,
  Brain,
  Plus,
  Clock,
  ArrowRight,
  BarChart2,
  Calendar,
  Flame,
  Sparkles,
  FileText,
  MessageSquare,
  Lightbulb,
  Pencil,
  Trash,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function Dashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const {
    collections,
    setCollections,
    recentActivity,
    setRecentActivity,
    setLoading,
    isLoading,
    studyItems,
    setStudyItems,
  } = useStore()

  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalStudyItems: 0,
    totalStudyTime: 0,
    streak: 3, // This would come from the backend in a real app
    lastStudied: new Date().toISOString(),
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch collections
        const collectionsResponse = await collectionsApi.getCollections()
        if (collectionsResponse.success && collectionsResponse.data) {
          setCollections(collectionsResponse.data)
        }

        // Fetch recent activity
        const activityResponse = await activityApi.getRecentActivity()
        if (activityResponse.success && activityResponse.data) {
          setRecentActivity(activityResponse.data)
        }

        // Fetch recent study items for quick access
        if (collectionsResponse.success && collectionsResponse.data && collectionsResponse.data.length > 0) {
          const recentCollection = collectionsResponse.data[0]
          const itemsResponse = await studyItemsApi.getStudyItems(recentCollection.id)
          if (itemsResponse.success && itemsResponse.data) {
            setStudyItems(itemsResponse.data)
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, setCollections, setRecentActivity, setLoading, setStudyItems])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Calculate the percentage of the day completed
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const totalDayMs = endOfDay.getTime() - startOfDay.getTime()
  const elapsedDayMs = now.getTime() - startOfDay.getTime()
  const dayProgress = Math.min(100, Math.round((elapsedDayMs / totalDayMs) * 100))

  return (
    <div className="flex min-h-screen bg-background">
      <MainNav />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}!</h1>
                <p className="text-muted-foreground mt-1">
                  Here's an overview of your study progress and recent activity.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </header>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid w-full grid-cols-3 md:w-[400px]">
              <TabsTrigger value="overview" className="flex items-center justify-center">
                <BarChart2 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="collections" className="flex items-center justify-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Collections
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center justify-center">
                <Clock className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Day Progress Card */}
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      <h3 className="font-medium">Today's Progress</h3>
                    </div>
                    <div className="text-sm">{dayProgress}% of day complete</div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2.5">
                    <div className="bg-white h-2.5 rounded-full" style={{ width: `${dayProgress}%` }}></div>
                  </div>
                  <div className="mt-4 text-sm text-blue-100">
                    Make the most of your day! Set a goal to study for at least 30 minutes.
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
                      Study Collections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{collections.length}</div>
                    <Button
                      variant="ghost"
                      className="w-full mt-2 justify-between"
                      onClick={() => router.push("/study-collections")}
                    >
                      View Collections
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Brain className="h-5 w-5 mr-2 text-purple-500" />
                      AI Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">3</div>
                    <Button
                      variant="ghost"
                      className="w-full mt-2 justify-between"
                      onClick={() => router.push("/ai-features")}
                    >
                      Explore AI Tools
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Flame className="h-5 w-5 mr-2 text-amber-500" />
                      Study Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{stats.streak} days</div>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <div
                          key={day}
                          className={`h-2 w-full rounded-full ${
                            day <= stats.streak ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-primary" />
                      Recent Collections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {collections.length > 0 ? (
                      <div className="space-y-4">
                        {collections.slice(0, 3).map((collection) => (
                          <div
                            key={collection.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/study-collections/${collection.id}`)}
                          >
                            <div className="flex items-center">
                              <div
                                className="h-10 w-10 rounded-full flex items-center justify-center mr-3"
                                style={{ backgroundColor: collection.color || "#3b82f6" }}
                              >
                                <BookOpen className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="font-medium">{collection.title}</div>
                                <div className="text-sm text-muted-foreground">{collection.item_count || 0} items</div>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <h3 className="font-medium mb-1">No collections yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create your first study collection to get started
                        </p>
                        <Button onClick={() => router.push("/study-collections")}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Collection
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-primary" />
                      AI Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push("/ai-features?tab=flashcards")}
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium">Generate Flashcards</div>
                            <div className="text-sm text-muted-foreground">Create flashcards from your notes</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push("/ai-features?tab=summarize")}
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="font-medium">Summarize Text</div>
                            <div className="text-sm text-muted-foreground">
                              Get concise summaries of your study materials
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push("/ai-features?tab=tutor")}
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                            <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="font-medium">AI Tutoring</div>
                            <div className="text-sm text-muted-foreground">Get answers to your study questions</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Study Tips Card */}
              <Card className="border-blue-200 dark:border-blue-900">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                    Study Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <h4 className="font-medium mb-2">Spaced Repetition</h4>
                      <p className="text-sm text-muted-foreground">
                        Review material at increasing intervals to improve long-term retention. Start with daily
                        reviews, then gradually increase to weekly and monthly.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <h4 className="font-medium mb-2">Active Recall</h4>
                      <p className="text-sm text-muted-foreground">
                        Test yourself regularly instead of passively re-reading. Try to recall information before
                        checking your notes.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <h4 className="font-medium mb-2">Pomodoro Technique</h4>
                      <p className="text-sm text-muted-foreground">
                        Study in focused 25-minute intervals with 5-minute breaks. After 4 intervals, take a longer
                        15-30 minute break.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="collections" className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Your Study Collections</h2>
                <Button onClick={() => router.push("/study-collections")}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Collection
                </Button>
              </div>

              {collections.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {collections.map((collection) => (
                    <Card
                      key={collection.id}
                      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/study-collections/${collection.id}`)}
                    >
                      <div className="h-2" style={{ backgroundColor: collection.color || "#3b82f6" }} />
                      <CardHeader>
                        <CardTitle>{collection.title}</CardTitle>
                        <CardDescription>{collection.description || "No description"}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{collection.item_count || 0} items</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-xl font-medium mb-1">No collections yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first study collection to get started</p>
                  <Button onClick={() => router.push("/study-collections")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Collection
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>

              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <Card key={activity.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4 flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                          {activity.activity_type === "create" && <Plus className="h-5 w-5 text-primary" />}
                          {activity.activity_type === "edit" && <Pencil className="h-5 w-5 text-primary" />}
                          {activity.activity_type === "delete" && <Trash className="h-5 w-5 text-primary" />}
                          {activity.activity_type === "study" && <BookOpen className="h-5 w-5 text-primary" />}
                          {activity.activity_type === "ai_generate" && <Sparkles className="h-5 w-5 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.item_title}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.activity_type === "create" && "Created new"}
                            {activity.activity_type === "edit" && "Edited"}
                            {activity.activity_type === "delete" && "Deleted"}
                            {activity.activity_type === "study" && "Studied"}
                            {activity.activity_type === "ai_generate" && "Generated with AI"} {activity.item_type}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <h3 className="text-xl font-medium mb-1">No activity yet</h3>
                  <p className="text-muted-foreground mb-4">Your recent study activity will appear here</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

