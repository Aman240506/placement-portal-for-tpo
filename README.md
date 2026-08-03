# Placement Portal

Placement Portal is a campus recruitment platform that connects students, recruiters, and administrators in one workflow. Students can build profiles, upload resumes, browse eligible drives, apply to opportunities, and review ATS-style feedback. Recruiters can create drives, review applicants, shortlist candidates, and manage hiring decisions. Admins can monitor activity, approve users and companies, track placements, and send notifications.

## What this solves

Campus placement processes are often spread across forms, spreadsheets, email, and manual follow-ups. This project centralizes the workflow so each role has one place to act on the right data:

- Students manage their profile, resume, and applications
- Recruiters create drives and evaluate applicants
- Admins oversee analytics, approvals, and placements

## Core Features

### Student Experience
- Register and sign in with role-based access
- Create and update a personal profile
- Upload a PDF resume for parsing
- View extracted skills and ATS-related insights
- Browse eligible drives and apply to them
- Track submitted applications

### Recruiter Experience
- Create and update placement drives
- View all applicants for a drive
- Shortlist or update candidate status
- Manage recruiter-owned openings

### Admin Experience
- View platform stats and placement analytics
- Approve or reject students and companies
- Review and update drives
- Track placed students
- Send selection emails

### Platform Capabilities
- JWT-based authentication and authorization
- PostgreSQL-backed data storage
- Resume upload and PDF text extraction
- AI-assisted resume parsing with Groq fallback logic
- Real-time notifications with Socket.io
- Public placement stats and drive listings

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend
- Node.js
- Express
- Socket.io
- PostgreSQL

### Supporting Services
- Cloudinary for file storage
- Multer for uploads
- pdfjs-dist for PDF parsing
- Groq for AI-assisted parsing
- Helmet, CORS, and rate limiting for API protection

## Project Structure

```text
placement-portal/
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       │   └── ai/
│       └── utils/
└── frontend/
    └── src/
        ├── context/
        ├── layouts/
        ├── pages/
        ├── services/
        └── utils/
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- PostgreSQL database
- Cloudinary account for resume storage
- Optional: Groq API key for AI parsing

### Install Dependencies

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

### Backend Environment Variables

Create a `.env` file in `backend/`.

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

### Frontend Environment Variables

Create a `.env` file in `frontend/` if you need a custom API URL.

```env
VITE_API_URL=http://localhost:5000
```

## Running Locally

### Start the backend

```powershell
cd backend
npm run dev
```

The API runs on `http://localhost:5000` by default.

### Start the frontend

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

Important backend routes include:

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

## Implementation Notes

- The frontend stores JWTs in `localStorage` and attaches them automatically to API requests.
- Resume parsing first extracts text from PDFs and then runs structured extraction.
- If AI parsing is unavailable, the backend falls back to regex-based skill and contact extraction.
- Socket.io is used for real-time notifications to connected users.

## License

No license has been specified yet.
