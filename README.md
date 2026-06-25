# 🖊️ Whiteboard — Backend

The backend server for **Whiteboard**, a real-time collaborative drawing application. Built with **Express**, **MongoDB (Mongoose)**, and **Socket.IO**, it handles user authentication, canvas persistence, sharing permissions, and live multi-user drawing sync.

<p align="center">
  <a href="https://whiteboard-alpha-pied.vercel.app/"><img src="https://img.shields.io/badge/Live%20App-Visit%20Site-success?style=for-the-badge&logo=vercel" alt="Live App"></a>
  <a href="https://github.com/Abhi27-27/whiteboard"><img src="https://img.shields.io/badge/Frontend%20Repo-View%20Code-blue?style=for-the-badge&logo=react" alt="Frontend Repo"></a>
</p>

> 🔗 **Quick Links**
> | Resource | Link |
> |---|---|
> | 🌐 Live Application | **[whiteboard-alpha-pied.vercel.app](https://whiteboard-alpha-pied.vercel.app/)** |
> | 🎨 Frontend Repository | **[github.com/Abhi27-27/whiteboard](https://github.com/Abhi27-27/whiteboard)** |
> | ⚙️ Backend Repository (this repo) | **[github.com/Abhi27-27/whiteboard-backend](https://github.com/Abhi27-27/whiteboard-backend)** |

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Socket.IO Events](#-socketio-events)
- [Deployment](#-deployment)
- [Related Repositories](#-related-repositories)
- [License](#-license)

---

## 🧭 Overview

This service powers the collaborative features of the Whiteboard app. It exposes a REST API for user accounts and canvas management, and a Socket.IO layer for real-time drawing synchronization between multiple connected clients on the same canvas.

It is designed to pair with the [Whiteboard frontend](https://github.com/Abhi27-27/whiteboard), and together they're deployed as the live app at **[whiteboard-alpha-pied.vercel.app](https://whiteboard-alpha-pied.vercel.app/)**.

## ✨ Features

- 🔐 **Authentication** — Secure registration/login with hashed passwords (bcrypt) and JWT-based sessions
- 🖼️ **Canvas Management** — Create, load, update, and delete canvases tied to an owner
- 🤝 **Sharing & Permissions** — Share a canvas with other users by email, with owner-only controls for sharing/unsharing/deleting
- ⚡ **Real-Time Sync** — Live drawing updates broadcast instantly to every collaborator via Socket.IO
- 🛡️ **Authorized Socket Access** — Token-verified canvas joins, rejecting unauthorized users before they can view or edit
- ☁️ **Vercel-Ready** — Configured for serverless deployment out of the box

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Deployment | Vercel |

## 🏗️ Architecture

```
┌─────────────────────┐        REST API        ┌──────────────────────┐
│                      │  ───────────────────►  │                      │
│   Whiteboard         │                        │   Whiteboard Backend │
│   Frontend (React)   │       Socket.IO        │   (Express + Mongo)  │
│                      │  ◄───────────────────► │                      │
└─────────────────────┘    real-time drawing    └──────────────────────┘
   whiteboard-alpha-               sync                    │
   pied.vercel.app                                         ▼
                                                   ┌──────────────────┐
                                                   │     MongoDB       │
                                                   └──────────────────┘
```

## 📁 Project Structure

```
whiteboard-backend/
├── config/
│   └── db.js                 # MongoDB connection setup
├── controllers/
│   ├── userController.js     # Register / login / get user
│   └── canvasController.js   # Canvas CRUD + sharing logic
├── middlewares/
│   └── authMiddleware.js     # JWT verification middleware
├── models/
│   ├── userModel.js          # User schema (hashed password)
│   └── canvasModel.js        # Canvas schema (owner, shared, elements)
├── routes/
│   ├── userRoutes.js         # /api/users endpoints
│   └── canvasRoutes.js       # /api/canvas endpoints
├── server.js                 # App entry point + Socket.IO server
├── vercel.json                # Vercel build/route config
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- A MongoDB connection string (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

```bash
# Clone the repository
git clone https://github.com/Abhi27-27/whiteboard-backend.git
cd whiteboard-backend

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env

# Start the server
npm start
```

The server runs on **port 5000** by default.

> 💡 To run the full app locally, also clone and run the [frontend repo](https://github.com/Abhi27-27/whiteboard) alongside this backend.

## 🔑 Environment Variables

Create a `.env` file in the project root with the following:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `FRONTEND_URL` | Deployed frontend URL, used for CORS (e.g. `https://whiteboard-alpha-pied.vercel.app`) |
| `JWT_SECRET` | Secret key used to sign/verify JWTs |

> ⚠️ **Security note:** The current codebase has a hardcoded `SECRET_KEY` fallback in `server.js` and `authMiddleware.js`. Replace this with `process.env.JWT_SECRET` before deploying to production, and never commit real secrets to version control.

## 📡 API Reference

Base URL (production): `https://<your-backend-deployment-url>/api`

### User Routes — `/api/users`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/register` | ❌ | Register a new user |
| `POST` | `/login` | ❌ | Log in and receive a JWT |
| `GET` | `/me` | ✅ | Get the currently authenticated user's profile |

### Canvas Routes — `/api/canvas`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/create` | ✅ | Create a new canvas |
| `PUT` | `/update` | ✅ | Update canvas elements |
| `GET` | `/load/:id` | ✅ | Load a canvas by ID |
| `PUT` | `/share/:id` | ✅ | Share a canvas with another user (by email) |
| `PUT` | `/unshare/:id` | ✅ | Remove a user's access to a canvas |
| `DELETE` | `/delete/:id` | ✅ | Delete a canvas (owner only) |
| `GET` | `/list` | ✅ | List all canvases owned by or shared with the user |

> 🔐 Authenticated routes require an `Authorization: Bearer <token>` header.

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `joinCanvas` | `{ canvasId }` | Join a canvas room (requires JWT in handshake headers) |
| `drawingUpdate` | `{ canvasId, elements }` | Broadcast a drawing update to other collaborators and persist it |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `loadCanvas` | `elements` | Sends current canvas state on join |
| `receiveDrawingUpdate` | `elements` | Broadcasts updated elements to other users in the room |
| `unauthorized` | `{ message }` | Sent when a user fails canvas authorization |
| `error` | `{ message }` | Sent on unexpected server errors |

## ☁️ Deployment

This backend is configured for **Vercel** via `vercel.json`, routing all requests through `server.js`. The live instance powers the deployed frontend at:

### 🌐 [whiteboard-alpha-pied.vercel.app](https://whiteboard-alpha-pied.vercel.app/)

To deploy your own instance:
1. Push this repo to GitHub
2. Import it into [Vercel](https://vercel.com/)
3. Add the environment variables listed above in your Vercel project settings
4. Deploy 🚀

## 🔗 Related Repositories

| Repository | Description |
|---|---|
| 🎨 **[whiteboard](https://github.com/Abhi27-27/whiteboard)** | Frontend client (React) that consumes this API |
| ⚙️ **whiteboard-backend** | This repository — REST API + Socket.IO server |
| 🌐 **[Live App](https://whiteboard-alpha-pied.vercel.app/)** | The deployed, fully working application |



<p align="center">Made by M.Abhiram Muni Reddy for real-time collaboration</p>
