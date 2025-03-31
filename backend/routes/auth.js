const express = require("express")
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { createClient } = require("@supabase/supabase-js")
const { authenticateToken } = require("../middleware/auth")

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide name, email, and password",
      })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("*").eq("email", email).single()

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user in Supabase
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error creating user",
      })
    }

    // Create JWT token
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    // Return user data and token
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          created_at: newUser.created_at,
          preferences: newUser.preferences,
        },
        token,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide email and password",
      })
    }

    // Check if user exists
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      })
    }

    // Update last login
    await supabase.from("users").update({ last_login: new Date() }).eq("id", user.id)

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" })

    // Return user data and token
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          last_login: user.last_login,
          preferences: user.preferences,
        },
        token,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Get current user
router.get("/user", authenticateToken, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        created_at: req.user.created_at,
        last_login: req.user.last_login,
        preferences: req.user.preferences,
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Update user
router.put("/user", authenticateToken, async (req, res) => {
  try {
    const { name, preferences } = req.body

    // Update user in Supabase
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        name: name || req.user.name,
        preferences: preferences || req.user.preferences,
      })
      .eq("id", req.user.id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return res.status(500).json({
        success: false,
        error: "Error updating user",
      })
    }

    // Return updated user data
    return res.status(200).json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        created_at: updatedUser.created_at,
        last_login: updatedUser.last_login,
        preferences: updatedUser.preferences,
      },
    })
  } catch (error) {
    console.error("Update user error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Forgot password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Please provide email",
      })
    }

    // Check if user exists
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error || !user) {
      // Don't reveal if user exists or not
      return res.status(200).json({
        success: true,
        data: "If an account with that email exists, a password reset link has been sent.",
      })
    }

    // Create reset token
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" })

    // Store reset token in database
    await supabase.from("password_resets").insert([
      {
        user_id: user.id,
        token: resetToken,
        expires_at: new Date(Date.now() + 3600000), // 1 hour
      },
    ])

    // In a real app, send email with reset link
    // For now, just return success
    return res.status(200).json({
      success: true,
      data: "If an account with that email exists, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body

    // Validate input
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide token and password",
      })
    }

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired token",
      })
    }

    // Check if token exists in database
    const { data: resetToken, error } = await supabase.from("password_resets").select("*").eq("token", token).single()

    if (error || !resetToken) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired token",
      })
    }

    // Check if token is expired
    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: "Token expired",
      })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Update user password
    await supabase.from("users").update({ password: hashedPassword }).eq("id", decoded.userId)

    // Delete used token
    await supabase.from("password_resets").delete().eq("token", token)

    return res.status(200).json({
      success: true,
      data: "Password reset successful",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return res.status(500).json({
      success: false,
      error: "Server error",
    })
  }
})

// Logout (just for API completeness, actual logout happens client-side)
router.post("/logout", authenticateToken, (req, res) => {
  return res.status(200).json({
    success: true,
    data: "Logged out successfully",
  })
})

module.exports = router

