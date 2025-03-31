"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collectionsApi, studyItemsApi } from "@/lib/api"
import { useStore } from "@/lib/store"
import type { StudyItem, StudyItemType } from "@/lib/types"
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  FileText,
  WalletCardsIcon as Cards,
  HelpCircle,
  Volume2,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function CollectionItems() {
  const router = useRouter()
  const params = useParams()
  const collectionId = params.id as string

  const { user, isLoading: authLoading } = useAuth()
  const { collections, currentCollection, setCurrentCollection, studyItems, setStudyItems, setLoading, isLoading } =
    useStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<StudyItemType | "all">("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<StudyItem | null>(null)
  const [audioLoading, setAudioLoading] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "note" as StudyItemType,
    tags: "",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchCollectionData = async () => {
      setLoading(true)
      try {
        // Fetch collection details
        const collectionResponse = await collectionsApi.getCollection(collectionId)
        if (collectionResponse.success && collectionResponse.data) {
          setCurrentCollection(collectionResponse.data)
        }

        // Fetch study items
        const itemsResponse = await studyItemsApi.getStudyItems(collectionId)
        if (itemsResponse.success && itemsResponse.data) {
          setStudyItems(itemsResponse.data)
        }
      } catch (error) {
        console.error("Error fetching collection data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user && collectionId) {
      fetchCollectionData()
    }

    return () => {
      setCurrentCollection(null)
      setStudyItems([])
    }
  }, [user, collectionId, setCurrentCollection, setStudyItems, setLoading])

  const filteredItems = studyItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = activeTab === "all" || item.type === activeTab

    return matchesSearch && matchesType
  })

  const handleCreateItem = async () => {
    setLoading(true)
    try {
      const tagsArray = formData.tags ? formData.tags.split(",").map((tag) => tag.trim()) : []

      const response = await studyItemsApi.createStudyItem({
        ...formData,
        tags: tagsArray,
        collection_id: collectionId,
        user_id: user?.id,
      })

      if (response.success && response.data) {
        setStudyItems([...studyItems, response.data])
        setCreateDialogOpen(false)
        setFormData({
          title: "",
          content: "",
          type: "note",
          tags: "",
        })
      }
    } catch (error) {
      console.error("Error creating study item:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditItem = async () => {
    if (!currentItem) return

    setLoading(true)
    try {
      const tagsArray = formData.tags ? formData.tags.split(",").map((tag) => tag.trim()) : []

      const response = await studyItemsApi.updateStudyItem(currentItem.id, {
        ...formData,
        tags: tagsArray,
      })

      if (response.success && response.data) {
        setStudyItems(studyItems.map((item) => (item.id === currentItem.id ? response.data : item)))
        setEditDialogOpen(false)
        setCurrentItem(null)
      }
    } catch (error) {
      console.error("Error updating study item:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!currentItem) return

    setLoading(true)
    try {
      const response = await studyItemsApi.deleteStudyItem(currentItem.id)

      if (response.success) {
        setStudyItems(studyItems.filter((item) => item.id !== currentItem.id))
        setDeleteDialogOpen(false)
        setCurrentItem(null)
      }
    } catch (error) {
      console.error("Error deleting study item:", error)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (item: StudyItem) => {
    setCurrentItem(item)
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
      tags: item.tags ? item.tags.join(", ") : "",
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (item: StudyItem) => {
    setCurrentItem(item)
    setDeleteDialogOpen(true)
  }

  const generateAudio = async (item: StudyItem) => {
    setAudioLoading(item.id)
    try {
      const response = await studyItemsApi.generateAudio(item.id)

      if (response.success && response.data) {
        setStudyItems(studyItems.map((i) => (i.id === item.id ? { ...i, audio_url: response.data.audio_url } : i)))
      }
    } catch (error) {
      console.error("Error generating audio:", error)
    } finally {
      setAudioLoading(null)
    }
  }

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl)
    audio.play()
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
            <Button variant="ghost" className="mb-4 pl-0 hover:pl-0" onClick={() => router.push("/study-collections")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Collections
            </Button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{currentCollection?.title || "Loading..."}</h1>
                <p className="text-muted-foreground mt-1">{currentCollection?.description || "No description"}</p>
              </div>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Study Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Study Item</DialogTitle>
                    <DialogDescription>Add a new study item to your collection.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: StudyItemType) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="flashcard">Flashcard</SelectItem>
                          <SelectItem value="quiz">Quiz Question</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Cell Structure"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">
                        {formData.type === "note"
                          ? "Content"
                          : formData.type === "flashcard"
                            ? "Front and Back (separate with |||)"
                            : "Question and Answer (separate with |||)"}
                      </Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder={
                          formData.type === "note"
                            ? "Your study notes..."
                            : formData.type === "flashcard"
                              ? "Front of card ||| Back of card"
                              : "Question ||| Answer"
                        }
                        className="min-h-[150px]"
                      />
                      {formData.type !== "note" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Use ||| to separate the question/front from the answer/back
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="e.g., biology, important, exam"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateItem}
                      disabled={!formData.title.trim() || !formData.content.trim() || isLoading}
                    >
                      {isLoading ? "Creating..." : "Create Item"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search study items..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="note">Notes</TabsTrigger>
                <TabsTrigger value="flashcard">Flashcards</TabsTrigger>
                <TabsTrigger value="quiz">Quiz Questions</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {item.type === "note" && <FileText className="h-5 w-5 mr-2 text-blue-500" />}
                        {item.type === "flashcard" && <Cards className="h-5 w-5 mr-2 text-purple-500" />}
                        {item.type === "quiz" && <HelpCircle className="h-5 w-5 mr-2 text-green-500" />}
                        <CardTitle>{item.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.type === "note" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => (item.audio_url ? playAudio(item.audio_url) : generateAudio(item))}
                            disabled={audioLoading === item.id}
                          >
                            {audioLoading === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {item.type === "note" ? (
                      <div className="whitespace-pre-wrap">{item.content}</div>
                    ) : item.type === "flashcard" ? (
                      <div className="flashcard">
                        <div className="flashcard-inner">
                          <div className="flashcard-front p-4 border rounded-lg bg-card">
                            <h3 className="font-medium mb-2">Front:</h3>
                            <p>{item.content.split("|||")[0]?.trim()}</p>
                          </div>
                          <div className="flashcard-back p-4 border rounded-lg bg-card mt-2">
                            <h3 className="font-medium mb-2">Back:</h3>
                            <p>{item.content.split("|||")[1]?.trim()}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="p-4 border rounded-lg bg-card">
                          <h3 className="font-medium mb-2">Question:</h3>
                          <p>{item.content.split("|||")[0]?.trim()}</p>
                        </div>
                        <div className="p-4 border rounded-lg bg-card mt-2">
                          <h3 className="font-medium mb-2">Answer:</h3>
                          <p>{item.content.split("|||")[1]?.trim()}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="text-sm text-muted-foreground">
                      Last updated {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              {activeTab === "all" ? (
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              ) : activeTab === "note" ? (
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              ) : activeTab === "flashcard" ? (
                <Cards className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              ) : (
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              )}
              <h3 className="text-xl font-medium mb-1">
                {searchQuery
                  ? "No matching study items found"
                  : `No ${activeTab !== "all" ? activeTab + "s" : "study items"} yet`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try a different search term or create a new study item"
                  : `Add your first ${activeTab !== "all" ? activeTab : "study item"} to get started`}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Study Item
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Study Item</DialogTitle>
            <DialogDescription>Update the details of your study item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: StudyItemType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="flashcard">Flashcard</SelectItem>
                  <SelectItem value="quiz">Quiz Question</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">
                {formData.type === "note"
                  ? "Content"
                  : formData.type === "flashcard"
                    ? "Front and Back (separate with |||)"
                    : "Question and Answer (separate with |||)"}
              </Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="min-h-[150px]"
              />
              {formData.type !== "note" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Use ||| to separate the question/front from the answer/back
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem} disabled={!formData.title.trim() || !formData.content.trim() || isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Study Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this study item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{currentItem?.title}</p>
            <p className="text-sm text-muted-foreground mt-1">Type: {currentItem?.type}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

