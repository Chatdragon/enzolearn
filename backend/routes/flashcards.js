const express = require("express")
const router = express.Router()
const { createClient } = require("@supabase/supabase-js")
const { authenticateToken } = require("../middleware/auth")

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Get all flashcard sets for the current user
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Get flashcard sets from Supabase
    const { data: flashcardSets, error } = await supabase
      .from("flashcard_sets")
      .select("*, cards:flashcards(*)")
      .eq("user_id", req.user.id)
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

// Get a single flashcard set by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Get flashcard set from Supabase
    const { data: flashcardSet, error } = await supabase
      .from("flashcard_sets")
      .select("*, cards:flashcards(*)")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(404).json({
        success: false,
        error: "Flashcard set not found",
      })
    }

    return res.status(200).json({
      success: true,
      data: flashcardSet,
    })
  } catch (error) {
    console.error("Get flashcard set error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Create a new flashcard set
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, collection_id, cards } = req.body

    // Validate input
    if (!title || !cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please provide title and cards array",
      })
    }

    // If collection_id is provided, check if it exists and belongs to user
    if (collection_id) {
      const { data: existingCollection, error: fetchError } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collection_id)
        .eq("user_id", req.user.id)
        .single()

      if (fetchError || !existingCollection) {
        return res.status(404).json({
          success: false,
          error: "Collection not found",
        })
      }
    }

    // Create flashcard set in Supabase
    const { data: newFlashcardSet, error } = await supabase
      .from("flashcard_sets")
      .insert([
        {
          user_id: req.user.id,
          collection_id,
          title,
          description,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error creating flashcard set",
      })
    }

    // Create flashcards in Supabase
    const flashcardsToInsert = cards.map((card) => ({
      set_id: newFlashcardSet.id,
      question: card.question,
      answer: card.answer,
      tags: card.tags,
      difficulty: card.difficulty,
    }))

    const { data: newFlashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select()

    if (flashcardsError) {
      console.error("Supabase error:", flashcardsError)
      return res.status(500).json({
        success: false,
        error: "Error creating flashcards",
      })
    }

    // Add activity record
    await supabase.from("activities").insert([
      {
        user_id: req.user.id,
        activity_type: "create",
        item_type: "flashcard_set",
        item_id: newFlashcardSet.id,
        item_title: newFlashcardSet.title,
        collection_id,
      },
    ])

    return res.status(201).json({
      success: true,
      data: {
        ...newFlashcardSet,
        cards: newFlashcards,
      },
    })
  } catch (error) {
    console.error("Create flashcard set error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Update a flashcard set
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, cards } = req.body

    // Validate input
    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Please provide title",
      })
    }

    // Check if flashcard set exists and belongs to user
    const { data: existingSet, error: fetchError } = await supabase
      .from("flashcard_sets")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (fetchError || !existingSet) {
      return res.status(404).json({
        success: false,
        error: "Flashcard set not found",
      })
    }

    // Update flashcard set in Supabase
    const { data: updatedSet, error } = await supabase
      .from("flashcard_sets")
      .update({
        title,
        description,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error updating flashcard set",
      })
    }

    // If cards are provided, update them
    if (cards && Array.isArray(cards)) {
      // Delete existing cards
      await supabase.from("flashcards").delete().eq("set_id", id)

      // Create new cards
      const flashcardsToInsert = cards.map((card) => ({
        set_id: id,
        question: card.question,
        answer: card.answer,
        tags: card.tags,
        difficulty: card.difficulty,
      }))

      const { data: newFlashcards, error: flashcardsError } = await supabase
        .from("flashcards")
        .insert(flashcardsToInsert)
        .select()

      if (flashcardsError) {
        console.error("Supabase error:", flashcardsError)
        return res.status(500).json({
          success: false,
          error: "Error updating flashcards",
        })
      }

      // Add updated cards to response
      updatedSet.cards = newFlashcards
    } else {
      // Get existing cards
      const { data: existingCards } = await supabase.from("flashcards").select("*").eq("set_id", id)

      updatedSet.cards = existingCards || []
    }

    // Add activity record
    await supabase.from("activities").insert([
      {
        user_id: req.user.id,
        activity_type: "edit",
        item_type: "flashcard_set",
        item_id: updatedSet.id,
        item_title: updatedSet.title,
        collection_id: updatedSet.collection_id,
      },
    ])

    return res.status(200).json({
      success: true,
      data: updatedSet,
    })
  } catch (error) {
    console.error("Update flashcard set error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Delete a flashcard set
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if flashcard set exists and belongs to user
    const { data: existingSet, error: fetchError } = await supabase
      .from("flashcard_sets")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (fetchError || !existingSet) {
      return res.status(404).json({
        success: false,
        error: "Flashcard set not found",
      })
    }

    // Delete flashcards first
    await supabase.from("flashcards").delete().eq("set_id", id)

    // Delete flashcard set from Supabase
    const { error } = await supabase.from("flashcard_sets").delete().eq("id", id)

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error deleting flashcard set",
      })
    }

    // Add activity record
    await supabase.from("activities").insert([
      {
        user_id: req.user.id,
        activity_type: "delete",
        item_type: "flashcard_set",
        item_id: id,
        item_title: existingSet.title,
        collection_id: existingSet.collection_id,
      },
    ])

    return res.status(200).json({
      success: true,
      data: "Flashcard set deleted successfully",
    })
  } catch (error) {
    console.error("Delete flashcard set error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

module.exports = router

