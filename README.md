# RWB Project Review System

**Rwanda Water Resources Board — Project Review & Tracking Platform**

A full-stack web application for managing, reviewing, and tracking water resource projects across Rwanda. External companies submit projects; Division Managers assign reviewers; Reviewers provide recommendations; and Administrators manage the system.

---

## 🌊 Features

### For External Companies (Managers)
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
| **Database** | PostgreSQL (production) / H2 (development) |
| **Migrations** | Flyway |
| **Build** | Maven (backend), Vite (frontend) |

---

## 🚀 Getting Started

### Prerequisites

- **Java 21** or later
- **Node.js 18+** and npm
- **PostgreSQL 14+** (or use H2 for development)
- **Maven 3.8+**

### 1. Clone the repository

```bash
git clone https://github.com/norbertndikumana/rwb-project-review-system.git
cd rwb-project-review-system
```

### 2. Set up the database

**Option A: PostgreSQL (production)**

```sql
CREATE DATABASE "RWB-Project";
CREATE USER rwb WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE "RWB-Project" TO rwb;
```

Update `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/RWB-Project
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=validate
```

**Option B: H2 (development — no setup needed)**

The default profile uses H2 in-memory database. No setup required.

### 3. Start the backend

```bash
cd backend
mvn spring-boot:run
```

The API starts at `http://localhost:8080`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

---

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Administrator** | `adminrvrwb@gmail.com` | `changeMe2026` |
| **Division Manager** | `dmrwboard@gmail.com` | `changeMe2026` |
| **Reviewer** | `ndajebob12@gmail.com` | `changeMe2026` |
| **External User** | `norbertndikumana20@gmail.com` | `changeMe2026` |

> **Note:** These are seeded automatically on first run.

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
│       ├── application.properties
│       └── db/migration/       # Flyway SQL migrations
├── frontend/                   # React SPA
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── pages/              # Route pages
│       ├── lib/                # API client, auth, theme
│       └── hooks/              # Custom React hooks
├── docker-compose.yml          # Docker setup
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
     │  ← Decision通知          │  Final Decision      │
     │◀─────────────────────────┤                      │
     │                          │                      │
```

**Status flow:**
```
DRAFT → SUBMITTED → IN_REVIEW → APPROVED → ARCHIVED
                    └──→ REJECTED → RESUBMITTED → IN_REVIEW
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Sign in (returns JWT) |
| GET | `/api/projects` | List visible projects |
| GET | `/api/projects/stats` | Dashboard statistics |
| POST | `/api/projects` | Create new project |
| POST | `/api/projects/{id}/submit` | Submit project for review |
| POST | `/api/projects/{id}/assign` | Assign reviewer (DM only) |
| POST | `/api/projects/{id}/approve` | Approve project (DM only) |
| POST | `/api/projects/{id}/reject` | Reject project (DM only) |
| POST | `/api/projects/{id}/recommend` | Submit recommendation (Reviewer) |
| GET | `/api/admin/users` | List all users (Admin) |
| PUT | `/api/admin/settings` | Update app settings (Admin) |
| GET | `/api/branding` | Get public branding images |

---

## 🐳 Docker

```bash
docker-compose up -d
```

This starts both the backend and frontend with a PostgreSQL database.

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
