# Collaborative Whiteboard - Backend

Node and Express server for a real-time collaborative whiteboard. It handles user
accounts, stores canvases in MongoDB, and runs the live drawing sync over Socket.io
so several people can draw on the same board at once. Authentication is JWT based.

This is the backend repo. The React frontend is in a separate repository.

## Tech stack

- Node.js with Express
- Socket.io for real-time updates
- MongoDB with Mongoose
- JSON Web Tokens for auth, bcrypt for password hashing
- cors, dotenv

## How it works

A whiteboard is stored as a list of drawing elements (shapes, lines, text), not as
an image. The live sync moves that list between users:

```
a user draws something
    -> the browser sends the updated element list over the socket
    -> the server broadcasts it to everyone else on that board
    -> the server saves the list to MongoDB after a short pause
```

A few details worth knowing:

Each board is a Socket.io room named by its canvas id, so updates only reach the
people on that board.

Saving is debounced. While someone is actively drawing, the server keeps resetting a
one second timer and only writes to the database once drawing pauses, instead of
writing on every stroke. This cuts the database load a lot during live drawing.

Access is checked on join. When a user opens a board, the server verifies their token
and confirms they are the owner or are in the board's shared list. Anyone else is
turned away.

## Project structure

```
backend/
  server.js                  Express app, Socket.io setup, the socket event handlers
  config/
    db.js                    Mongoose connection
  models/
    userModel.js             email and password (hashed on save)
    canvasModel.js           owner, shared users, elements (stored as JSON), createdAt
  controllers/
    userController.js        register, login, get current user
    canvasController.js      create, update, load, share, unshare, delete, list
  middlewares/
    authMiddleware.js        verifies the JWT and attaches the user
  routes/
    userRoutes.js            register, login, me
    canvasRoutes.js          create, update, load, share, unshare, delete, list
```

## Socket events

The server listens for four events:

```
joinCanvas        verify access, join the board's room, send the saved elements
leaveCanvas       leave the room
drawingUpdate     broadcast the new elements and schedule a debounced save
disconnect        cleanup
```

## API routes

User routes:

```
POST /api/users/register     create an account
POST /api/users/login        log in, returns a token
GET  /api/users/me           get the current user
```

Canvas routes (token required):

```
POST   /api/canvas/create        create a new board
PUT    /api/canvas/update        save a board's elements
GET    /api/canvas/load/:id      load a board
PUT    /api/canvas/share/:id     share a board with a user
PUT    /api/canvas/unshare/:id   remove a shared user
DELETE /api/canvas/delete/:id    delete a board
GET    /api/canvas/list          list the user's boards
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- A MongoDB database (local or a free Atlas cluster)

### Install and run

```bash
npm install
npm run dev
```

### Environment variables

Create a `.env` file in the backend root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
```

## Deployment

The backend runs on any Node host such as Render or Railway. Set the same
environment variables there and allow the frontend's URL in the CORS settings. Note
that Socket.io needs the host to support WebSocket connections, which Render and
Railway do.