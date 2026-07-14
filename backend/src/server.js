const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const driveRoutes = require("./routes/drive.routes");
const adminRoutes = require("./routes/admin.routes");
const shortlistRoutes = require("./routes/shortlist.routes");

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/drives", driveRoutes);
app.use("/api/drives", shortlistRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const rateLimit  = require('express-rate-limit');
app.use('/api/auth', rateLimit({ windowMs: 15*60*1000, max: 20, message: { success: false, message: 'Too many attempts' } }));
app.use('/api',      rateLimit({ windowMs: 15*60*1000, max: 200, message: { success: false, message: 'Too many requests' } }));