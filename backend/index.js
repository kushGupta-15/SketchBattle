import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cron from "node-cron";
import { connectDB } from "./db/dbconnection.js";
import roomRoutes from "./routes/roomRoutes.js";
import dotenv from "dotenv";
import logoutRoutes from "./routes/logoutRoutes.js";
import { socketAuthMiddleware } from "./middleware/socketAuth.js";
import setupSocketHandlers from "./handlers/socketHandlers.js";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`Warning: ${varName} is not set in .env`);
  }
});

const app = express();
app.use(express.json());
const server = http.createServer(app);
connectDB();

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: `${process.env.FRONTEND_URL}`,
    methods: ["GET", "POST"],
  },
});

// Enable CORS
app.use(cors());

// Socket.IO Authentication Middleware
io.use(socketAuthMiddleware);

// Setup Socket Handlers
setupSocketHandlers(io);

// Routes
app.use("/api/rooms", roomRoutes);
app.use("/api/logout", logoutRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
const PING_URL = process.env.SELF_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  const pingBackend = async () => {
    try {
      const response = await fetch(PING_URL);
      console.log(`Self-ping to ${PING_URL} status: ${response.status}`);
    } catch (error) {
      console.error(`Self-ping failed for ${PING_URL}:`, error.message || error);
    }
  };

  cron.schedule("0 */10 * * * *", async () => {
    await pingBackend();
  }, {
    scheduled: true,
    timezone: "UTC",
  });

  // Initial ping after startup so Render receives the first request quickly.
  setTimeout(() => {
    pingBackend();
  }, 30 * 1000);
});
