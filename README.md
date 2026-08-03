# Placement Portal

Placement Portal is a full-stack campus recruitment platform for students, recruiters, and administrators. It lets students manage profiles, upload resumes, browse eligible drives, apply to opportunities, and review ATS-style resume insights. Recruiters can create and manage drives, view applicants, shortlist candidates, and update hiring decisions. Admins can monitor the overall system, approve users/companies, manage drives, and send placement notifications.

## What this project includes

- Role-based authentication for students, recruiters, and admins
- Student profile management and resume upload
- Resume parsing with PDF text extraction and AI-assisted skill extraction
- ATS checker and application tracking for students
- Drive creation, drive management, and applicant review for recruiters
- Admin analytics, student/company approval, placed-student tracking, and notifications
- Public placement statistics and drive listings
- Real-time updates with Socket.io

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express, Socket.io
- Database: PostgreSQL
- File handling: Multer, Cloudinary
- Security and auth: JWT, Helmet, CORS, rate limiting
- AI and parsing: pdfjs-dist, Groq, resume parsing utilities

## Project Structure

```text
placement-portal/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   └── ai/
│   │   └── utils/
│   └── package.json
└── frontend/
    ├── src/
    │   ├── context/
    │   ├── layouts/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    └── package.json
```

## Key Features

### Students
- Register and log in
- Edit profile details
- Upload and parse resumes
- Check ATS score
- Browse eligible drives
- Apply to drives and track applications

### Recruiters
- Create and manage drives
- View applicants for each drive
- Shortlist or update candidate status
- Track recruiter-owned drives

### Admins
- View platform analytics and placement stats
- Approve or reject students and companies
- Manage drives and drive instructions
- View placed students
- Send selection emails

## Local Development

### Prerequisites

- Node.js 18+ recommended
- PostgreSQL database
- Cloudinary account for resume storage
- Optional: Groq API key for AI-assisted resume parsing

### 1. Install dependencies

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

### 2. Configure environment variables

Create a `.env` file in `backend/` with the values your deployment needs.

```env
PORT=5000
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GROQ_API_KEY=your_groq_api_key
SMTP_EMAIL=your_email_address
SMTP_PASSWORD=your_email_password
```

If the frontend needs a custom API URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Start the backend

```powershell
cd backend
npm run dev
```

The API runs on `http://localhost:5000` by default.

### 4. Start the frontend

```powershell
cd frontend
npm run dev
```

The web app runs on `http://localhost:5173` by default.

## Available Scripts

### Backend

- `npm start` - start the API server
- `npm run dev` - start the API server with nodemon

### Frontend

- `npm run dev` - start the Vite development server
- `npm run build` - build the frontend for production
- `npm run preview` - preview the production build
- `npm run lint` - run ESLint

## API Overview

A few important backend routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/students/profile`
- `PUT /api/students/profile`
- `POST /api/students/resume`
- `GET /api/students/applications`
- `GET /api/drives/eligible`
- `POST /api/drives/:id/apply`
- `POST /api/drives`
- `GET /api/drives/:id/applicants`
- `GET /api/admin/stats`
- `GET /api/admin/analytics`
- `GET /api/public/stats`

## Notes

- The frontend uses JWT stored in `localStorage` and attaches it automatically to API requests.
- Resume parsing falls back to regex-based extraction if AI parsing is unavailable.
- Socket.io is used for real-time notifications between the backend and logged-in users.

## License

No license has been specified for this repository yet.
