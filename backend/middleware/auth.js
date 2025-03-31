const jwt = require("jsonwebtoken")
const { createClient } = require("@supabase/supabase-js")

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check if user exists in Supabase
    const { data: user, error } = await supabase.from("users").select("*").eq("id", decoded.userId).single()

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "Invalid token.",
      })
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    console.error("Authentication error:", error)
    return res.status(401).json({
      success: false,
      error: "Invalid token.",
    })
  }
}

module.exports = { authenticateToken }

