# ISCP Learning Management System - Backend

This is the backend server for the ISCP Learning Management System, built with Node.js, Express, and MySQL.

## Features

- Authentication & Authorization
- User Management (Student, Teacher, Admin)
- Course Management
- Assignments & Submissions
- Grades Management
- Announcements
- Messaging System
- Discussion Forums
- Class Sessions
- Academic Archives

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm

## Setup Instructions

1. Clone the repository
2. Install dependencies
   ```
   npm install
   ```
3. Create a MySQL database named `iscp_lms`
4. Configure `.env` file with your database credentials (use `.env.example` as a template)

5. Set up the database (Option 1 - Automatic)
   ```
   npm run dev
   ```
   The server will automatically create the necessary tables on first run.

6. Set up the database (Option 2 - Manual SQL execution)
   Execute the SQL script in the `/sql/database.sql` file to create all tables and seed initial data.

7. Start the development server
   ```
   npm run dev
   ```

8. The server will be running at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user details (protected)

## Environmental Variables

- `PORT` - Server port (default: 5000)
- `DB_HOST` - Database host
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT secret key for token generation
- `JWT_EXPIRES_IN` - JWT token expiration time
- `CLIENT_URL` - Frontend URL for CORS

## License

This project is licensed under the ISC License. 