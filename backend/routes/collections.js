const express = require("express")
const router = express.Router()
const { createClient } = require("@supabase/supabase-js")
const { authenticateToken } = require("../middleware/auth")

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Get all collections for the current user
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Get collections from Supabase
    const { data: collections, error } = await supabase
      .from("collections")
      .select(`
        *,
        item_count:study_items(count)
      `)
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error fetching collections",
      })
    }

    // Format collections to include item count
    const formattedCollections = collections.map((collection) => ({
      ...collection,
      item_count: collection.item_count[0]?.count || 0,
    }))

    return res.status(200).json({
      success: true,
      data: formattedCollections,
    })
  } catch (error) {
    console.error("Get collections error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Get a single collection by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Get collection from Supabase
    const { data: collection, error } = await supabase
      .from("collections")
      .select(`
        *,
        item_count:study_items(count)
      `)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(404).json({
        success: false,
        error: "Collection not found",
      })
    }

    // Format collection to include item count
    const formattedCollection = {
      ...collection,
      item_count: collection.item_count[0]?.count || 0,
    }

    return res.status(200).json({
      success: true,
      data: formattedCollection,
    })
  } catch (error) {
    console.error("Get collection error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Create a new collection
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, color, icon } = req.body

    // Validate input
    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Please provide a title",
      })
    }

    // Create collection in Supabase
    const { data: newCollection, error } = await supabase
      .from("collections")
      .insert([
        {
          user_id: req.user.id,
          title,
          description,
          color,
          icon,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error creating collection",
      })
    }

    // Add activity record
    await supabase.from("activities").insert([
      {
        user_id: req.user.id,
        activity_type: "create",
        item_type: "collection",
        item_id: newCollection.id,
        item_title: newCollection.title,
      },
    ])

    return res.status(201).json({
      success: true,
      data: {
        ...newCollection,
        item_count: 0,
      },
    })
  } catch (error) {
    console.error("Create collection error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Update a collection
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, color, icon } = req.body

    // Validate input
    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Please provide a title",
      })
    }

    // Check if collection exists and belongs to user
    const { data: existingCollection, error: fetchError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (fetchError || !existingCollection) {
      return res.status(404).json({
        success: false,
        error: "Collection not found",
      })
    }

    // Update collection in Supabase
    const { data: updatedCollection, error } = await supabase
      .from("collections")
      .update({
        title,
        description,
        color,
        icon,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select(`
        *,
        item_count:study_items(count)
      `)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error updating collection",
      })
    }

    // Add activity record
    await supabase.from("activities").insert([
      {
        user_id: req.user.id,
        activity_type: "edit",
        item_type: "collection",
        item_id: updatedCollection.id,
        item_title: updatedCollection.title,
      },
    ])

    // Format collection to include item count
    const formattedCollection = {
      ...updatedCollection,
      item_count: updatedCollection.item_count[0]?.count || 0,
    }

    return res.status(200).json({
      success: true,
      data: formattedCollection,
    })
  } catch (error) {
    console.error("Update collection error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Delete a collection
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if collection exists and belongs to user
    const { data: existingCollection, error: fetchError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (fetchError || !existingCollection) {
      return res.status(404).json({
        success: false,
        error: "Collection not found",
      })
    }

    // Delete collection from Supabase
    const { error } = await supabase.from("collections").delete().eq("id", id)

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error deleting collection",
      })
    }

    // Add activity record
    await supabase.from("activities").insert([
      {
        user_id: req.user.id,
        activity_type: "delete",
        item_type: "collection",
        item_id: id,
        item_title: existingCollection.title,
      },
    ])

    return res.status(200).json({
      success: true,
      data: "Collection deleted successfully",
    })
  } catch (error) {
    console.error("Delete collection error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Get all study items for a collection
router.get("/:id/items", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if collection exists and belongs to user
    const { data: existingCollection, error: fetchError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (fetchError || !existingCollection) {
      return res.status(404).json({
        success: false,
        error: "Collection not found",
      })
    }

    // Get study items from Supabase
    const { data: studyItems, error } = await supabase
      .from("study_items")
      .select("*")
      .eq("collection_id", id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error fetching study items",
      })
    }

    return res.status(200).json({
      success: true,
      data: studyItems,
    })
  } catch (error) {
    console.error("Get study items error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Get all flashcards for a collection
router.get("/:id/flashcards", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if collection exists and belongs to user
    const { data: existingCollection, error: fetchError } = await supabase
      .from("collections")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (fetchError || !existingCollection) {
      return res.status(404).json({
        success: false,
        error: "Collection not found",
      })
    }

    // Get flashcard sets from Supabase
    const { data: flashcardSets, error } = await supabase
      .from("flashcard_sets")
      .select("*, cards:flashcards(*)")
      .eq("collection_id", id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error fetching flashcard sets",
      })
    }

    return res.status(200).json({
      success: true,
      data: flashcardSets,
    })
  } catch (error) {
    console.error("Get flashcard sets error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

module.exports = router

