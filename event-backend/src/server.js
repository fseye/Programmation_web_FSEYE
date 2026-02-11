// server.js
const express = require("express");
const cors = require("cors");

const { getAllEvents, createEvent, getMyEvents, deleteEvent,subscribeEvent, unsubscribeEvent, updateEvent, getEventSubscribers, duplicateEvent} = require("./events/eventController");
const { requireAuth } = require("./auth/authMiddleware");
const { login, signup, me } = require("./auth/authController");

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.post("/api/login", login);
app.post("/api/signup", signup);
app.get("/api/me", requireAuth, me);

// Events routes
app.get("/api/events", requireAuth, getAllEvents);
app.get("/api/events/mine", requireAuth, getMyEvents);
app.post("/api/events", requireAuth, createEvent);
app.delete("/api/events/:id", requireAuth, deleteEvent);

app.post("/api/events/:id/subscribe", requireAuth, subscribeEvent);
app.delete("/api/events/:id/subscribe", requireAuth, unsubscribeEvent);
app.put("/api/events/:id", requireAuth, updateEvent);
app.get("/api/events/:id/subscribers", requireAuth, getEventSubscribers);
app.post("/api/events/:id/duplicate", requireAuth, duplicateEvent);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
