const express = require("express")
const router = express.Router()
const { createClient } = require("@supabase/supabase-js")
const { authenticateToken } = require("../middleware/auth")
const axios = require("axios")

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Get a single study item by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Get study item from Supabase
    const { data: studyItem, error } = await supabase
      .from("study_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(404).json({
        success: false,
        error: "Study item not found",
      })
    }

    return res.status(200).json({
      success: true,
      data: studyItem,
    })
  } catch (error) {
    console.error("Get study item error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Create a new study item
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, content, type, tags, collection_id } = req.body

    // Validate input
    if (!title || !content || !type || !collection_id) {
      return res.status(400).json({
        success: false,
        error: "Please provide title, content, type, and collection_id",
      })
    }

    // Check if collection exists and belongs to user
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

    // Create study item in Supabase
    const { data: newStudyItem, error } = await supabase
      .from("study_items")
      .insert([
        {
          user_id: req.user.id,
          collection_id,
          title,
          content,
          type,
          tags,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error creating study item",
      })
    }

    // Add activity record
    await supabase.from("activities").insert([
      {
        user_id: req.user.id,
        activity_type: "create",
        item_type: type,
        item_id: newStudyItem.id,
        item_title: newStudyItem.title,
        collection_id,
      },
    ])

    return res.status(201).json({
      success: true,
      data: newStudyItem,
    })
  } catch (error) {
    console.error("Create study item error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Update a study item
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { title, content, type, tags } = req.body

    // Validate input
    if (!title || !content || !type) {
      return res.status(400).json({
        success: false,
        error: "Please provide title, content, and type",
      })
    }

    // Check if study item exists and belongs to user
    const { data: existingItem, error: fetchError } = await supabase
      .from("study_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (fetchError || !existingItem) {
      return res.status(404).json({
        success: false,
        error: "Study item not found",
      })
    }

    // Update study item in Supabase
    const { data: updatedItem, error } = await supabase
      .from("study_items")
      .update({
        title,
        content,
        type,
        tags,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error updating study item",
      })
    }

    // Add activity record
    await supabase.from("activities").insert([
      {
        user_id: req.user.id,
        activity_type: "edit",
        item_type: type,
        item_id: updatedItem.id,
        item_title: updatedItem.title,
        collection_id: updatedItem.collection_id,
      },
    ])

    return res.status(200).json({
      success: true,
      data: updatedItem,
    })
  } catch (error) {
    console.error("Update study item error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Delete a study item
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if study item exists and belongs to user
    const { data: existingItem, error: fetchError } = await supabase
      .from("study_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (fetchError || !existingItem) {
      return res.status(404).json({
        success: false,
        error: "Study item not found",
      })
    }

    // Delete study item from Supabase
    const { error } = await supabase.from("study_items").delete().eq("id", id)

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error deleting study item",
      })
    }

    // Add activity record
    await supabase.from("activities").insert([
      {
        user_id: req.user.id,
        activity_type: "delete",
        item_type: existingItem.type,
        item_id: id,
        item_title: existingItem.title,
        collection_id: existingItem.collection_id,
      },
    ])

    return res.status(200).json({
      success: true,
      data: "Study item deleted successfully",
    })
  } catch (error) {
    console.error("Delete study item error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Generate audio for a study item
router.post("/:id/audio", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if study item exists and belongs to user
    const { data: studyItem, error: fetchError } = await supabase
      .from("study_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single()

    if (fetchError || !studyItem) {
      return res.status(404).json({
        success: false,
        error: "Study item not found",
      })
    }

    // Get text to convert to speech
    let textToConvert = studyItem.content

    // If it's a flashcard or quiz, only use the answer part
    if (studyItem.type === "flashcard" || studyItem.type === "quiz") {
      const parts = studyItem.content.split("|||")
      if (parts.length > 1) {
        textToConvert = parts[1].trim()
      }
    }

    // Limit text length to avoid issues with the API
    if (textToConvert.length > 5000) {
      textToConvert = textToConvert.substring(0, 5000)
    }

    // Call Eleven Labs API
    const response = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
      {
        text: textToConvert,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        responseType: "arraybuffer",
      },
    )

    // Generate a unique filename
    const fileName = `audio_${id}_${Date.now()}.mp3`

    // Upload audio to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio")
      .upload(fileName, response.data, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
      })

    if (uploadError) {
      console.error("Supabase storage error:", uploadError)
      return res.status(500).json({
        success: false,
        error: "Error uploading audio file",
      })
    }

    // Get public URL for the audio file
    const { data: publicUrlData } = supabase.storage.from("audio").getPublicUrl(fileName)

    // Update study item with audio URL
    await supabase
      .from("study_items")
      .update({
        audio_url: publicUrlData.publicUrl,
        updated_at: new Date(),
      })
      .eq("id", id)

    return res.status(200).json({
      success: true,
      data: {
        audio_url: publicUrlData.publicUrl,
      },
    })
  } catch (error) {
    console.error("Generate audio error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

module.exports = router

