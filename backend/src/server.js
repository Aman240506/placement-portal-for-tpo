// Routes
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const driveRoutes = require('./routes/drive.routes');
const adminRoutes = require('./routes/admin.routes');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/drives', driveRoutes);
app.use('/api/admin', adminRoutes);