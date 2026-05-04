# Kabadi King — Smart Scrap Pickup System

A full-stack MERN application for smart scrap pickup scheduling, collector assignment, and recycling routing.

---

## Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB running locally (`localhost:27017`)

---

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Seed the Database (Demo Data)
```bash
cd backend
node seed.js
```

### 4. Start Backend
```bash
cd backend
npm run dev
```
Backend runs at: http://localhost:5000

### 5. Start Frontend (new terminal)
```bash
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173

---

## Demo Accounts (password: `123456`)

| Role      | Email                  |
|-----------|------------------------|
| Admin     | admin@test.com         |
| User      | user@test.com          |
| Collector | collector@test.com     |
| Collector | collector2@test.com    |
| Recycler  | recycler@test.com      |

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS    |
| Backend   | Node.js + Express.js              |
| Database  | MongoDB + Mongoose                |
| Auth      | JWT (JSON Web Tokens)             |
| Maps      | OpenStreetMap via React-Leaflet   |
| Files     | Multer (local uploads)            |

---

## Project Structure

```
Ashutosh Kabad/
├── backend/
│   ├── config/         MongoDB connection
│   ├── controllers/    Route handlers
│   ├── middleware/     Auth, error, upload
│   ├── models/         Mongoose schemas
│   ├── routes/         Express routers
│   ├── utils/          Assignment & routing engines
│   ├── seed.js         Demo data seeder
│   └── server.js       Entry point
└── frontend/
    └── src/
        ├── context/    Auth & Notification providers
        ├── pages/      Role-based pages
        ├── components/ Shared UI components
        ├── services/   Axios API layer
        └── utils/      Date helpers
```

---

## Complete Flow

1. **User** signs up and creates a pickup request (scrap type, weight, address, schedule)
2. **Assignment Engine** automatically assigns the nearest verified available collector
3. **Collector** receives notification, accepts, and heads out for pickup
4. **Collector** confirms pickup with actual weight and uploads proof
5. **Routing Engine** routes the scrap to the nearest compatible recycler automatically
6. **Recycler** marks the batch as delivered and processed
7. **Transaction** is created and payment is reflected in the wallet

---

## API Base URL
`http://localhost:5000/api`

### Key Endpoints
| Method | Endpoint                         | Description               |
|--------|----------------------------------|---------------------------|
| POST   | /api/auth/register               | Register new user         |
| POST   | /api/auth/login                  | Login                     |
| POST   | /api/requests                    | Create pickup request     |
| GET    | /api/requests/my                 | User's requests           |
| PUT    | /api/requests/:id/accept         | Collector accepts request |
| PUT    | /api/requests/:id/pickup         | Confirm pickup            |
| GET    | /api/admin/stats                 | Admin dashboard stats     |
| GET    | /api/notifications               | User notifications        |
