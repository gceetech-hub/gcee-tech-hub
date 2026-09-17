# GCEE Tech Hub Website

Official website of **GCEE Tech Hub – Government College of Engineering, Erode (GCEE)**.

A full-stack student technology community website for showcasing GCEE Tech Hub activities, events, registrations, announcements, workshops, projects, and community information.

🌐 **Live Website:** https://gcee-tech-hub.vercel.app/

---

## Table of Contents

* [Features](#features)
* [Technology Stack](#technology-stack)
* [Project Structure](#project-structure)
* [Running Locally](#running-locally)
* [Environment Variables](#environment-variables)
* [Email Configuration](#email-configuration)
* [Student Registration Flow](#student-registration-flow)
* [Admin Panel](#admin-panel)
* [Event Management](#event-management)
* [Event Registration Flow](#event-registration-flow)
* [Event Email Flow](#event-email-flow)
* [Managing Students](#managing-students)
* [Updating Website Content](#updating-website-content)
* [Deploying](#deploying)
* [Design System](#design-system)
* [Adding New Pages or Sections](#adding-new-pages-or-sections)
* [Troubleshooting](#troubleshooting)
* [Contributing](#contributing)
* [Contact](#contact)

---

# Features

### Public Website

* GCEE Tech Hub homepage
* About GCEE Tech Hub
* Community information
* Upcoming events
* Past events
* Event details
* Event posters
* Event photos
* Student registration
* Contact information
* Responsive design

### Admin Dashboard

* Secure admin login
* Dashboard overview
* Student registrations
* Student management
* Event creation
* Event editing
* Event deletion
* Event registration management
* Event email sending
* Event completion management
* Search and filtering
* Database-backed data management

### Email System

The website uses **SMTP/Nodemailer** for sending emails.

Email functionality can be used for:

* Student registration emails
* OTP/email verification
* Event registration links
* Event announcements
* Event-related communication

No n8n automation is required for the email workflow.

---

# Technology Stack

| Technology              | Purpose             |
| ----------------------- | ------------------- |
| React                   | Frontend UI         |
| Vite                    | Frontend build tool |
| JavaScript / TypeScript | Application logic   |
| Tailwind CSS            | Styling             |
| GSAP                    | Animations          |
| Node.js                 | Backend runtime     |
| Express.js              | Backend API         |
| MongoDB                 | Database            |
| Mongoose                | MongoDB ODM         |
| Nodemailer              | SMTP email service  |
| Gmail SMTP              | Email delivery      |
| Vercel                  | Frontend deployment |
| GitHub                  | Source control      |

> **Note:** This project does **not use Next.js**.

---

# Project Structure

```text
gcee-tech-hub/
├── public/
│   ├── events/
│   │   ├── posters/
│   │   └── photos/
│   ├── images/
│   ├── logos/
│   └── favicon.*
│
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── Navbar.*
│   │   ├── Footer.*
│   │   ├── Hero.*
│   │   ├── About.*
│   │   ├── Events.*
│   │   ├── Community.*
│   │   ├── Contact.*
│   │   └── PageLoader.*
│   ├── pages/
│   │   ├── Home.*
│   │   ├── Events.*
│   │   ├── EventDetails.*
│   │   ├── Register.*
│   │   └── Contact.*
│   ├── admin/
│   │   ├── AdminLogin.*
│   │   ├── AdminDashboard.*
│   │   ├── Students.*
│   │   ├── Events.*
│   │   └── Settings.*
│   ├── services/
│   │   ├── api.*
│   │   └── email.*
│   ├── data/
│   │   └── events.*
│   ├── App.*
│   ├── main.*
│   └── index.css
│
├── backend/
│   ├── models/
│   │   ├── Student.*
│   │   ├── Event.*
│   │   └── Registration.*
│   ├── routes/
│   │   ├── auth.*
│   │   ├── students.*
│   │   ├── events.*
│   │   ├── registrations.*
│   │   └── email.*
│   ├── controllers/
│   │   ├── authController.*
│   │   ├── studentController.*
│   │   ├── eventController.*
│   │   └── emailController.*
│   ├── middleware/
│   │   └── auth.*
│   ├── config/
│   │   └── db.*
│   ├── utils/
│   │   └── mailer.*
│   └── server.*
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── vite.config.*
├── tailwind.config.*
└── README.md
```

> The exact folder names may differ depending on the implementation. Keep the README synchronized with the actual repository.

---

# Running Locally

## Requirements

Install the following:

* Node.js 20+
* npm
* MongoDB Atlas account
* Gmail account with an App Password, or a Resend API key
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/gceetech-hub/gcee-tech-hubs-.git
cd gcee-tech-hubs-
```

---

## 2. Install Dependencies

```bash
npm install
npm run install:all
```

---

## 3. Configure Environment Variables

Create the required `.env` files and configure MongoDB and email settings.

See the [Environment Variables](#environment-variables) section.

---

## 4. Start the Application

```bash
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

The backend normally runs at:

```text
http://localhost:5000
```

---

# Environment Variables

Backend (`backend/.env`):

```env
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority"

JWT_SECRET="a_long_random_secret"
JWT_EXPIRES_IN="30d"

PORT=5000
NODE_ENV=development

ADMIN_NAME="GCEE Tech Hub Admin"
ADMIN_EMAIL="admin@gceetechhub.in"
ADMIN_PASSWORD="your_secure_admin_password"

GMAIL_USER="yourclub@gmail.com"
GMAIL_APP_PASSWORD="your_gmail_app_password"

# RESEND_API_KEY="re_..."
```

Copy the templates:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### MongoDB

`MONGODB_URI` is required.

If MongoDB is unavailable, the API operates in degraded mode and returns a friendly `503` response for database-dependent requests.

For local DNS issues with MongoDB Atlas:

```env
FORCE_DNS=8.8.8.8,1.1.1.1
```

Leave `FORCE_DNS` unset on Vercel unless specifically required.

### API URL

The frontend defaults to:

```text
/api
```

Only configure `VITE_API_URL` when the backend is hosted on a separate origin.

---

# Email Configuration

GCEE Tech Hub supports email delivery through **Gmail SMTP/Nodemailer** or **Resend**.

### Gmail

```env
GMAIL_USER="yourclub@gmail.com"
GMAIL_APP_PASSWORD="your_app_password"
```

### Resend

```env
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

Never expose email credentials in frontend code.

---

# Student Registration Flow

```text
Student
   │
   ▼
Open GCEE Tech Hub Website
   │
   ▼
Registration Form
   │
   ├── Name
   ├── Gmail
   ├── Phone
   ├── Department
   ├── Year
   └── Other required information
   │
   ▼
Submit Registration
   │
   ▼
Backend API
   │
   ├── Validate Data
   ├── Store Data in MongoDB
   └── Send Email
   │
   ▼
Registration Successful
```

The backend is responsible for database operations and email delivery.

---

# Admin Panel

The GCEE Tech Hub admin dashboard provides administrative controls for managing the website.

## Admin Login

```text
/admin/login
```

Authentication flow:

```text
Admin Login
     │
     ▼
Authentication
     │
     ▼
Admin Session
     │
     ▼
Admin Dashboard
```

Sensitive credentials must remain on the server side.

---

# Admin Dashboard

The dashboard can display:

* Total students
* Total event registrations
* Upcoming events
* Completed events
* Recent registrations
* Database status
* Event statistics

```text
Admin Dashboard
│
├── Overview
├── Students
├── Events
│   ├── Create Event
│   ├── Edit Event
│   ├── Delete Event
│   ├── Registrations
│   └── Send Event
└── Settings
```

---

# Event Management

Events can be managed through the admin dashboard.

Event information may include:

```text
Event Title
Event Description
Event Date
Event Time
Venue
Handled By
Event Type
Registration Link
Poster
```

Example:

```js
{
  title: "Introduction to Git and GitHub",
  date: "15-09-2026",
  time: "10:00 AM - 12:00 PM",
  venue: "GCEE Campus",
  handledBy: "GCEE Tech Hub",
  type: "Workshop",
  description: "A practical workshop on Git and GitHub.",
  registrationLink: "https://forms.google.com/..."
}
```

---

# Event Lifecycle

```text
CREATE EVENT
     │
     ▼
UPCOMING EVENT
     │
     ▼
SEND EVENT / REGISTRATION LINK
     │
     ▼
STUDENTS REGISTER
     │
     ▼
EVENT DAY
     │
     ▼
EVENT COMPLETED
     │
     ▼
PAST EVENTS
```

Past events should automatically appear in the Past Events section according to the event date.

---

# Event Registration Flow

```text
Admin
 │
 ├── Create Event
 │
 ▼
Event Published
 │
 ▼
Admin Sends Event
 │
 ▼
Email Sent Through SMTP
 │
 ▼
Student Receives Email
 │
 ▼
Student Opens Registration Link
 │
 ▼
Google Form / Registration Page
 │
 ▼
Student Submits Registration
 │
 ▼
Registration Stored / Retrieved
 │
 ▼
Admin Views Registrations
```

The admin dashboard should display registration information and the number of registered students.

---

# Event Email Flow

```text
Admin Dashboard
      │
      ▼
Select Event
      │
      ▼
Click "Send Event"
      │
      ▼
Backend Email API
      │
      ▼
Nodemailer
      │
      ▼
Gmail SMTP
      │
      ▼
Students' Gmail
```

The frontend must never contain SMTP credentials.

---

# Managing Students

The admin dashboard provides student management functionality.

Admin can:

* View students
* Search students
* Filter students
* View registration details
* Delete student records when required

Example:

```text
Students
────────────────────────────────────
Name       Email              Year
────────────────────────────────────
Student 1  student@gmail.com  II
Student 2  student@gmail.com  III
Student 3  student@gmail.com  IV
```

---

# Updating Website Content

## Homepage

Typical sections include:

```text
Navbar
Hero
About
Community
Events
What We Do
Join / Community CTA
Contact
Footer
```

---

## Navbar

Typical navigation:

```text
Home
About
Events
Community
Contact
```

---

## Events

Recommended event fields:

```text
Title
Date
Time
Venue
Handled By
Description
Poster
Registration Link
Photos
```

---

## Event Posters

Store posters in:

```text
public/events/posters/
```

Example:

```text
public/events/posters/git-workshop.jpg
```

---

## Event Photos

Store event photos in:

```text
public/events/photos/
```

Example:

```text
public/events/photos/git-workshop-01.jpg
public/events/photos/git-workshop-02.jpg
```

---

# Deployment

The website is deployed on Vercel.

🌐 **Production Website:**

https://gcee-tech-hub.vercel.app/

Before deployment:

```bash
npm run build
```

Then:

```bash
git add .
git commit -m "Update GCEE Tech Hub website"
git push
```

Vercel can automatically deploy the latest commit from the configured branch.

---

# Vercel Environment Variables

Configure the following in Vercel:

```text
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
ADMIN_NAME
ADMIN_EMAIL
ADMIN_PASSWORD
GMAIL_USER
GMAIL_APP_PASSWORD
# or RESEND_API_KEY
PUBLIC_APP_URL
```

`MONGODB_URI` must also be configured in the Vercel production environment.

Never place database passwords, SMTP credentials, or private API keys in publicly exposed frontend variables.

---

# Deployment Architecture

```text
                 ┌─────────────────────┐
                 │ GCEE Tech Hub User  │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   React + Vite      │
                 │     Frontend        │
                 └──────────┬──────────┘
                            │ API
                            ▼
                 ┌─────────────────────┐
                 │ Node.js + Express   │
                 │      Backend        │
                 └──────┬─────────┬────┘
                        │         │
                        ▼         ▼
                 ┌──────────┐  ┌────────────┐
                 │ MongoDB  │  │ SMTP/Gmail │
                 └──────────┘  └────────────┘
```

---

# Design System

GCEE Tech Hub uses a modern developer-community visual style with a clean and responsive interface.

## Design Principles

* Responsive design
* Mobile-first layouts
* Glassmorphism elements where appropriate
* Smooth GSAP animations
* Clear typography
* Accessible buttons and forms
* Consistent spacing
* Developer/community-focused visual identity

---

# Fonts

Recommended:

```text
Primary: Inter
Code / Technical: JetBrains Mono
```

---

# Animations

GSAP can be used for:

* Page loading
* Hero animations
* Scroll animations
* Event card animations
* Section transitions
* Interactive UI elements

Avoid excessive animations that negatively affect performance.

---

# Adding New Pages or Sections

## New Homepage Section

Create a component:

```text
src/components/YourSection.jsx
```

Add it to the homepage and give it a unique ID:

```html
<section id="your-section">
```

Add a navigation link if required.

---

## New Public Page

Example:

```text
src/pages/Community.jsx
```

Configure the route:

```text
/community
```

---

## New Admin Page

Create the admin page and protect it with the existing authentication system.

Examples:

```text
/admin/events
/admin/students
/admin/settings
```

---

# API Structure

Typical API endpoints:

```text
/api/auth
/api/students
/api/events
/api/registrations
/api/email
```

Example:

```text
POST   /api/events
GET    /api/events
PUT    /api/events/:id
DELETE /api/events/:id

GET    /api/students
DELETE /api/students/:id

GET    /api/registrations
POST   /api/registrations

POST   /api/email/send-event
```

---

# Troubleshooting

## Frontend Does Not Start

```bash
npm install
npm run dev
```

Check:

```bash
node -v
npm -v
```

---

## Backend Does Not Connect

Check:

```text
Backend URL
MongoDB URI
Environment variables
Network connection
MongoDB Atlas Network Access
```

---

## MongoDB Connection Error

Check the health endpoint:

```text
GET /api/health
```

Healthy response:

```json
{
  "database": "connected"
}
```

If the response is:

```json
{
  "database": "unavailable"
}
```

the API cannot currently reach MongoDB.

Check:

1. `MONGODB_URI`
2. MongoDB Atlas Database Access
3. MongoDB Atlas Network Access
4. MongoDB cluster status
5. DNS configuration
6. Vercel environment variables

For local DNS issues:

```env
FORCE_DNS=8.8.8.8,1.1.1.1
```

---

## Email Not Sending

Check:

```text
GMAIL_USER
GMAIL_APP_PASSWORD
```

or:

```text
RESEND_API_KEY
```

For Gmail:

```env
GMAIL_USER="yourclub@gmail.com"
GMAIL_APP_PASSWORD="your_16_character_app_password"
```

Use a Google App Password instead of the normal Gmail password.

---

## CORS Error

If frontend and backend are deployed separately, allow the frontend origin:

```text
https://gcee-tech-hub.vercel.app
```

Avoid using `*` unnecessarily when authentication or credentials are involved.

---

## 404 Error

Check:

* Frontend routes
* Backend API URL
* Vercel routing
* React Router configuration
* API deployment
* Environment variables

---

## Event Not Found

Check:

```text
Event ID
Event database record
API endpoint
Frontend API URL
```

---

## Build Failure

Run:

```bash
npm install
npm run build
```

Fix the first actual build error before deploying.

---

# Security

Never commit:

```text
.env
.env.local
SMTP passwords
MongoDB passwords
Admin passwords
API secrets
Private keys
```

Use environment variables for all sensitive configuration.

---

# Performance

Before deploying:

* Optimize event posters
* Compress event photos
* Avoid unnecessary API requests
* Lazy-load large images
* Minimize unnecessary animations
* Use production builds
* Keep MongoDB queries efficient

Recommended image formats:

```text
WebP
JPG
PNG
```

---

# Contributing

Contributions to GCEE Tech Hub are welcome.

Before submitting changes:

```bash
npm install
npm run build
```

Then:

```bash
git add .
git commit -m "Describe your change"
git push
```

For larger changes:

1. Create an issue.
2. Create a feature branch.
3. Implement the change.
4. Test locally.
5. Run the production build.
6. Submit a pull request.

Keep commits focused and descriptive.

---

# Development Workflow

```text
Clone Repository
       │
       ▼
Install Dependencies
       │
       ▼
Configure .env
       │
       ▼
Start Backend
       │
       ▼
Start Vite Frontend
       │
       ▼
Develop / Test
       │
       ▼
npm run build
       │
       ▼
Git Commit
       │
       ▼
Git Push
       │
       ▼
Vercel Deployment
       │
       ▼
Production Website
```

---

# Event Management Workflow

```text
Admin Login
    │
    ▼
Admin Dashboard
    │
    ▼
Create Event
    │
    ▼
Publish Event
    │
    ▼
Send Event
    │
    ▼
SMTP / Gmail
    │
    ▼
Students Receive Email
    │
    ▼
Student Registration
    │
    ▼
Admin Views Registrations
    │
    ▼
Event Day
    │
    ▼
Complete Event
    │
    ▼
Past Event
```

---

# Technology Architecture

```text
┌─────────────────────────────────────────┐
│             GCEE Tech Hub               │
│               Website                   │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          React + Vite + Tailwind        │
│              Frontend                   │
└───────────────────┬─────────────────────┘
                    │ REST API
                    ▼
┌─────────────────────────────────────────┐
│          Node.js + Express              │
│              Backend                    │
└──────────────┬───────────────┬──────────┘
               │               │
               ▼               ▼
       ┌──────────────┐  ┌──────────────┐
       │   MongoDB    │  │ Nodemailer   │
       │   Database   │  │ SMTP/Gmail   │
       └──────────────┘  └──────────────┘
```

---

# License

This project is maintained for the **GCEE Tech Hub community at Government College of Engineering, Erode**.

Refer to the repository license file for the applicable licensing terms.

---

# Contact

For website bugs, feature requests, improvements, or documentation changes:

* Open a GitHub issue.
* Submit a pull request for code improvements.
* Contact the GCEE Tech Hub organizing team through the official community channels.

---

# GCEE Tech Hub

**GCEE Tech Hub – Government College of Engineering, Erode**

🌐 **Live Website:** https://gcee-tech-hub.vercel.app/

Built for the student technology community at **Government College of Engineering, Erode**.

---

## Repository

```text
Repository Name: gcee-tech-hubs-
Organization: gceetech-hub
Repository URL: https://github.com/gceetech-hub/gcee-tech-hubs-
Project: GCEE Tech Hub
```

The repository and website should consistently use the **GCEE Tech Hub** branding across the README, UI, page titles, metadata, emails, admin dashboard, event content, footer, and deployment configuration.
