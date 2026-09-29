"use strict";

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 8080;
const JWT_SECRET =
  process.env.JWT_SECRET || "CHANGE_THIS_SECRET_IN_RAILWAY";

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

/*
  Demo in-memory storage.

  For production, replace this with PostgreSQL.
*/
const users = [];
const conversations = new Map();

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  const token = header.substring(7);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session."
    });
  }
}

/* ---------------- HOME ---------------- */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    name: "KNOX AI",
    status: "online"
  });
});

/* ---------------- REGISTER ---------------- */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((u) => u.email === normalizedEmail)) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      id: Date.now().toString(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash
    };

    users.push(user);
    conversations.set(user.id, []);

    const token = createToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Registration failed."
    });
  }
});

/* ---------------- LOGIN ---------------- */

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    const user = users.find(
      (u) => u.email === normalizedEmail
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const valid = await bcrypt.compare(
      password || "",
      user.passwordHash
    );

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = createToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Login failed."
    });
  }
});

/* ---------------- PROFILE ---------------- */

app.get("/api/me", auth, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found."
    });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

/* ---------------- CONVERSATIONS ---------------- */

app.get("/api/conversations", auth, (req, res) => {
  const list = conversations.get(req.user.id) || [];

  res.json({
    success: true,
    conversations: list.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    }))
  });
});

/* ---------------- CHAT ---------------- */

app.post("/api/chat", auth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required."
      });
    }

    let userConversations =
      conversations.get(req.user.id) || [];

    let conversation = userConversations.find(
      (item) => item.id === conversationId
    );

    if (!conversation) {
      conversation = {
        id: Date.now().toString(),
        title: message.trim().slice(0, 50),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };

      userConversations.unshift(conversation);
      conversations.set(req.user.id, userConversations);
    }

    conversation.messages.push({
      role: "user",
      content: message.trim(),
      createdAt: new Date().toISOString()
    });

    /*
      REAL AI CONNECTION

      Set AI_API_URL, AI_API_KEY and AI_MODEL in Railway.

      The exact request format depends on the AI provider.
    */

    let reply;

    if (!process.env.AI_API_URL || !process.env.AI_API_KEY) {
      reply =
        "KNOX AI is connected to the server, but the AI provider has not been configured yet. Add your AI API settings to the backend environment variables.";
    } else {
      const response = await fetch(
        process.env.AI_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.AI_API_KEY}`
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL,
            messages: [
              {
                role: "system",
                content:
                  "You are KNOX AI, a helpful and friendly AI assistant."
              },
              ...conversation.messages.slice(-20).map((item) => ({
                role: item.role,
                content: item.content
              }))
            ]
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          `AI provider returned ${response.status}`
        );
      }

      const data = await response.json();

      reply =
        data?.choices?.[0]?.message?.content ||
        data?.output?.[0]?.content?.[0]?.text ||
        "I couldn't generate a response.";
    }

    conversation.messages.push({
      role: "assistant",
      content: reply,
      createdAt: new Date().toISOString()
    });

    conversation.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      conversationId: conversation.id,
      reply
    });
  } catch (error) {
    console.error("CHAT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "KNOX AI could not process that message."
    });
  }
});

/* ---------------- GET CHAT ---------------- */

app.get(
  "/api/conversations/:id",
  auth,
  (req, res) => {
    const list =
      conversations.get(req.user.id) || [];

    const conversation = list.find(
      (item) => item.id === req.params.id
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found."
      });
    }

    res.json({
      success: true,
      conversation
    });
  }
);

/* ---------------- DELETE CHAT ---------------- */

app.delete(
  "/api/conversations/:id",
  auth,
  (req, res) => {
    const list =
      conversations.get(req.user.id) || [];

    const filtered = list.filter(
      (item) => item.id !== req.params.id
    );

    conversations.set(req.user.id, filtered);

    res.json({
      success: true
    });
  }
);

/* ---------------- SPA FALLBACK ---------------- */

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

app.listen(PORT, () => {
  console.log(`KNOX AI running on port ${PORT}`);
});
