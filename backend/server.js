const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const { createClient } = require("@supabase/supabase-js")
const morgan = require("morgan")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")

// Load environment variables
dotenv.config()

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean),
    credentials: true,
  }),
)
app.use(express.json())
app.use(morgan("dev"))
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Import routes
const authRoutes = require("./routes/auth")
const collectionsRoutes = require("./routes/collections")
const studyItemsRoutes = require("./routes/studyItems")
const flashcardsRoutes = require("./routes/flashcards")
const aiRoutes = require("./routes/ai")
const activityRoutes = require("./routes/activity")

// Use routes
app.use("/api/auth", authRoutes)
app.use("/api/collections", collectionsRoutes)
app.use("/api/study-items", studyItemsRoutes)
app.use("/api/flashcards", flashcardsRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/activity", activityRoutes)

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to EnzoLearn API" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    error: "Server error",
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app

