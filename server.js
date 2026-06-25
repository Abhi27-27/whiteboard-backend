const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectToDB = require("./config/db");
const { Server } = require("socket.io");
const http = require("http");
const Canvas = require("./models/canvasModel");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

const userRoutes = require("./routes/userRoutes");
const canvasRoutes = require("./routes/canvasRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/canvas", canvasRoutes);

connectToDB();

const server = http.createServer(app);

const allowedOrigins = ["http://localhost:3000", process.env.FRONTEND_URL]
  .filter(Boolean)
  .map((o) => o.replace(/\/+$/, ""));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

let canvasData = {};
const saveTimers = {};

app.locals.io = io;
app.locals.canvasData = canvasData;
app.locals.saveTimers = saveTimers;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinCanvas", async ({ canvasId }) => {
    console.log("Joining canvas:", canvasId);
    try {
      const token =
        (socket.handshake.auth && socket.handshake.auth.token) ||
        (socket.handshake.headers.authorization || "").replace("Bearer ", "");

      if (!token) {
        socket.emit("unauthorized", { message: "Access Denied: No Token" });
        return;
      }

      const decoded = jwt.verify(token, SECRET_KEY);
      const userId = decoded.userId;

      const canvas = await Canvas.findById(canvasId);
      if (
        !canvas ||
        (String(canvas.owner) !== String(userId) &&
          !canvas.shared.map(String).includes(String(userId)))
      ) {
        socket.emit("unauthorized", {
          message: "You are not authorized to join this canvas.",
        });
        return;
      }

      socket.join(canvasId);
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined canvas ${canvasId}`);

      const elements = canvasData[canvasId] ?? canvas.elements;
      socket.emit("loadCanvas", elements);
    } catch (error) {
      console.error(error);
      socket.emit("error", {
        message: "An error occurred while joining the canvas.",
      });
    }
  });

  socket.on("leaveCanvas", ({ canvasId }) => {
    socket.leave(canvasId);
    console.log(`Socket ${socket.id} left canvas ${canvasId}`);
  });

  socket.on("drawingUpdate", async ({ canvasId, elements }) => {
    try {
      if (!canvasId) return;
      canvasData[canvasId] = elements;

      socket.to(canvasId).emit("receiveDrawingUpdate", elements);

      clearTimeout(saveTimers[canvasId]);
      saveTimers[canvasId] = setTimeout(async () => {
        try {
          await Canvas.findByIdAndUpdate(
            canvasId,
            { elements },
            { new: true, useFindAndModify: false }
          );
        } catch (e) {
          console.error("DB save failed:", e.message);
        }
      }, 1000);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));