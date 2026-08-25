# RWB Project Review System

**Rwanda Water Resources Board — Project Review & Tracking Platform**

A full-stack web application for managing, reviewing, and tracking water resource projects across Rwanda. External companies submit projects; Division Managers assign reviewers; Reviewers provide recommendations; and Administrators manage the system.

![License](https://img.shields.io/badge/license-MIT-blue)
![Java](https://img.shields.io/badge/Java-21-orange)
![React](https://img.shields.io/badge/React-18-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1)

---

## 🌊 Features

### For External Companies (External Users)
- Register and submit water resource projects
- Upload attachments (documents, ZIP files, project links)
- Track project status through the review pipeline
- Receive notifications on decisions

### For Division Managers
- Dashboard with project oversight and assignment queue
- Assign reviewers to submitted projects
- Make final approve/reject decisions
- Track team performance and review progress

### For Reviewers
- Personal review queue with assigned projects
- Submit recommendations (approve / request info / return)
- Track completion statistics

### For Administrators
- User management (create, edit, enable/disable, delete)
- System-wide dashboard with graphs and activity feed
- App Management panel (appearance, security, email, support settings)
- Branding management (landing page images, auth backgrounds)
- Registration approval workflow

### System-Wide
- **Project Track** — monitor all projects with status filters, problem indicators, and organization breakdown
- **Multi-language support** (English, Kinyarwana, French)
- **MFA (Multi-Factor Authentication)** via email
- **Role-Based Access Control (RBAC)** — 5 distinct roles
- **Responsive design** — works on desktop, tablet, and mobile
- **WCAG AA accessibility** compliant
- **Animated UI** — Framer Motion page transitions, stagger animations, toasts

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router, Tailwind CSS, Framer Motion |
| **Backend** | Spring Boot 3.5, Java 21, Spring Security, JWT |
| **Database** | PostgreSQL 16 (production) / H2 (development) |
| **Migrations** | Flyway |
| **Build** | Maven (backend), Vite (frontend) |
| **Deployment** | Docker Compose (recommended) |

---

## 🚀 Deployment Options

### Option 1: Docker (Recommended — One Command)

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
# 1. Clone the repository
git clone https://github.com/norbertndikumana20-commits/rwb-project-review-system.git
cd rwb-project-review-system

# 2. Copy the environment template and edit it
copy .env.example .env
# Open .env and change passwords/secrets for production!

# 3. Start everything with one command
docker compose up -d --build
```

**That's it!** The system is now running:

| Service | URL |
|---------|-----|
| **Frontend (App)** | http://localhost |
| **Backend API** | http://localhost:8080 |
| **Database** | localhost:5432 |

**Useful Docker commands:**
```bash
docker compose up -d          # Start (detached)
docker compose down           # Stop
docker compose logs -f        # View logs
docker compose down -v        # Stop AND delete all data
docker compose up -d --build  # Rebuild after code changes
```

### Option 2: Manual Setup (Development)

**Prerequisites:**
- Java 21 or later ([Download](https://adoptium.net/))
- Node.js 18+ and npm ([Download](https://nodejs.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- Maven 3.8+ (or use the included Maven Wrapper)

```bash
# 1. Clone the repository
git clone https://github.com/norbertndikumana20-commits/rwb-project-review-system.git
cd rwb-project-review-system

# 2. Set up PostgreSQL database
#    Open psql or pgAdmin and run:
CREATE DATABASE "RWB-Project";

# 3. Configure database credentials
#    Edit backend/src/main/resources/application.yml
#    Set your PostgreSQL username and password

# 4. Start the backend
cd backend
mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run
# API starts at http://localhost:8080

# 5. Start the frontend (new terminal)
cd frontend
npm install
npm run dev
# App opens at http://localhost:5173
```

### Option 3: Cloud Deployment (Free)

#### A. Railway.app (Easiest cloud option)

1. Create account at [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `norbertndikumana20-commits/rwb-project-review-system`
4. Railway auto-detects the Docker setup and deploys both services
5. Set environment variables in the Railway dashboard:
   - `POSTGRES_PASSWORD` → your secure password
   - `JWT_SECRET` → a random 64-character string
   - `MAIL_ENABLED` → `false` (or `true` with Gmail SMTP credentials)
6. Railway gives you a public URL — share it with your team!

#### B. Render.com

1. Create account at [render.com](https://render.com)
2. **Database:** Create a new PostgreSQL instance → copy the Internal Database URL
3. **Backend:** New Web Service → connect GitHub repo → build with Docker → set env vars
4. **Frontend:** New Static Site → connect GitHub repo → build command: `cd frontend && npm install && npm run build` → publish directory: `frontend/dist`

#### C. Vercel (Frontend) + Railway (Backend)

1. Frontend on [vercel.com](https://vercel.com) → Import GitHub repo → Framework: Vite → Root Directory: `frontend`
2. Backend on [railway.app](https://railway.app) → Deploy from GitHub → set database env vars

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Administrator** | `adminrvrwb@gmail.com` | `changeMe2026` |
| **Division Manager** | `dmrwboard@gmail.com` | `changeMe2026` |
| **Reviewer** | `ndajebob12@gmail.com` | `changeMe2026` |
| **External User** | `norbertndikumana20@gmail.com` | `changeMe2026` |

> **Note:** These accounts are seeded automatically on first run via Flyway migrations.

### How External Users Access the System

1. **Go to the registration page** at `/register`
2. **Fill in the form:** Full name, email, organization/company name, password
3. **Verify email:** The admin receives a notification to approve the account
4. **Admin approves:** Go to Admin → App Management → Users → Approve
5. **User logs in:** Can now submit projects, upload documents, and track status

### Account Lifecycle
```
Register → Email Verification → Admin Approval → First Project → Full Access
   │            │                    │                │
PENDING_EMAIL → PENDING_ADMIN → ACTIVE_FIRST_  → ACTIVE
VERIFICATION     REVIEW         PROJECT_REQUIRED
```

---

## 📂 Project Structure

```
rwb/
├── backend/                    # Spring Boot API
│   ├── src/main/java/com/rwb/review/
│   │   ├── domain/             # Entities, enums
│   │   ├── dto/                # Request/Response DTOs
│   │   ├── repo/               # JPA repositories
│   │   ├── security/           # JWT, filters
│   │   ├── service/            # Business logic
│   │   └── web/                # REST controllers
│   └── src/main/resources/
│       ├── application.yml     # Backend config
│       └── db/migration/       # Flyway SQL migrations
├── frontend/                   # React SPA
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── pages/              # Route pages
│       ├── lib/                # API client, auth, theme
│       └── hooks/              # Custom React hooks
├── .env.example                # Environment template
├── docker-compose.yml          # Docker orchestration
└── README.md
```

---

## 🔄 Project Workflow

```
External Company          Division Manager         Reviewer
     │                          │                      │
     │  Submit Project          │                      │
     ├─────────────────────────▶│                      │
     │                          │  Assign Reviewer     │
     │                          ├─────────────────────▶│
     │                          │                      │
     │                          │  Submit Recommendation│
     │                          │◀─────────────────────┤
     │                          │                      │
     │  ← Decision              │  Final Decision      │
     │◀─────────────────────────┤                      │
```

**Status flow:**
```
DRAFT → SUBMITTED → IN_REVIEW → APPROVED → ARCHIVED
                    └──→ REJECTED → RESUBMITTED → IN_REVIEW
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `RWB-Project` | Database name |
| `POSTGRES_USER` | `postgres` | Database username |
| `POSTGRES_PASSWORD` | `changeMe2025` | Database password |
| `JWT_SECRET` | *(dev default)* | Secret for JWT signing (change in production!) |
| `MAIL_ENABLED` | `false` | Enable real email delivery |
| `MAIL_HOST` | `smtp.gmail.com` | SMTP server |
| `MAIL_USERNAME` | — | Gmail address |
| `MAIL_PASSWORD` | — | Gmail App Password |

### Enabling Email (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an App Password for "Mail"
4. Set in `.env`:
   ```
   MAIL_ENABLED=true
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
   ```

---

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new account | No |
| POST | `/api/auth/login` | Sign in (returns JWT) | No |
| GET | `/api/projects` | List visible projects | Yes |
| GET | `/api/projects/stats` | Dashboard statistics | Yes |
| POST | `/api/projects` | Create new project | Yes |
| POST | `/api/projects/{id}/submit` | Submit for review | Yes |
| POST | `/api/projects/{id}/assign` | Assign reviewer (DM) | Yes |
| POST | `/api/projects/{id}/approve` | Approve (DM) | Yes |
| POST | `/api/projects/{id}/reject` | Reject (DM) | Yes |
| POST | `/api/projects/{id}/recommend` | Recommend (Reviewer) | Yes |
| GET | `/api/admin/users` | List all users (Admin) | Yes |
| PUT | `/api/admin/settings` | Update app settings | Yes |
| GET | `/api/branding` | Get branding images | No |

---

## 🐛 Troubleshooting

### "Port 8080 already in use"
```bash
# Find and kill the process using port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### "Password authentication failed for user 'rwb'"
Your PostgreSQL credentials don't match `application.yml`. Verify username/password.

### "Frontend can't reach backend"
Make sure both servers are running. The frontend proxies `/api` requests to `localhost:8080`.

### Reset everything
```bash
docker compose down -v    # Delete database data
docker compose up -d --build  # Rebuild from scratch
```

---

## 📄 License

This project is developed for the **Rwanda Water Resources Board**.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Contact

For support or questions about this system, contact the RWB IT team.

> 🌊 Built with ❤️ for Rwanda's water resources management
