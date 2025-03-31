"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { MainNav } from "@/components/main-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { collectionsApi } from "@/lib/api"
import { useStore } from "@/lib/store"
import type { Collection } from "@/lib/types"
import { BookOpen, Plus, Pencil, Trash2, Search, ArrowRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function StudyCollections() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { collections, setCollections, setLoading, isLoading } = useStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    color: "#3b82f6",
  })

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

  const filteredCollections = collections.filter(
    (collection) =>
      collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleCreateCollection = async () => {
    setLoading(true)
    try {
      const response = await collectionsApi.createCollection({
        ...formData,
        user_id: user?.id,
      })

      if (response.success && response.data) {
        setCollections([...collections, response.data])
        setCreateDialogOpen(false)
        setFormData({
          title: "",
          description: "",
          color: "#3b82f6",
        })
      }
    } catch (error) {
      console.error("Error creating collection:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCollection = async () => {
    if (!currentCollection) return

    setLoading(true)
    try {
      const response = await collectionsApi.updateCollection(currentCollection.id, formData)

      if (response.success && response.data) {
        setCollections(collections.map((c) => (c.id === currentCollection.id ? response.data : c)))
        setEditDialogOpen(false)
        setCurrentCollection(null)
      }
    } catch (error) {
      console.error("Error updating collection:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCollection = async () => {
    if (!currentCollection) return

    setLoading(true)
    try {
      const response = await collectionsApi.deleteCollection(currentCollection.id)

      if (response.success) {
        setCollections(collections.filter((c) => c.id !== currentCollection.id))
        setDeleteDialogOpen(false)
        setCurrentCollection(null)
      }
    } catch (error) {
      console.error("Error deleting collection:", error)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (collection: Collection) => {
    setCurrentCollection(collection)
    setFormData({
      title: collection.title,
      description: collection.description || "",
      color: collection.color || "#3b82f6",
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (collection: Collection) => {
    setCurrentCollection(collection)
    setDeleteDialogOpen(true)
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
          <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Study Collections</h1>
              <p className="text-muted-foreground mt-1">Organize your study materials into collections</p>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Collection</DialogTitle>
                  <DialogDescription>Create a new collection to organize your study materials.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Biology 101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this collection"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-8 p-1"
                      />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: formData.color }} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCollection} disabled={!formData.title.trim() || isLoading}>
                    {isLoading ? "Creating..." : "Create Collection"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </header>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredCollections.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCollections.map((collection) => (
                <Card key={collection.id} className="overflow-hidden">
                  <div className="h-2" style={{ backgroundColor: collection.color || "#3b82f6" }} />
                  <CardHeader>
                    <CardTitle>{collection.title}</CardTitle>
                    <CardDescription>{collection.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span>{collection.item_count || 0} items</span>
                      <span className="mx-2">•</span>
                      <span>Created {formatDistanceToNow(new Date(collection.created_at), { addSuffix: true })}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={() => openEditDialog(collection)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(collection)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={() => router.push(`/study-collections/${collection.id}`)}>
                      View Collection
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-xl font-medium mb-1">
                {searchQuery ? "No matching collections found" : "No collections yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try a different search term or create a new collection"
                  : "Create your first study collection to get started"}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Collection Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>Update the details of your study collection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-8 p-1"
                />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: formData.color }} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCollection} disabled={!formData.title.trim() || isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this collection? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{currentCollection?.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{currentCollection?.description || "No description"}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCollection} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

