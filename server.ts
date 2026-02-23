import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite Database
const db = new Database(path.join(__dirname, "todos.db"));
db.pragma("journal_mode = WAL");

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/todos", (req, res) => {
    try {
      const todos = db.prepare("SELECT * FROM todos ORDER BY created_at DESC").all();
      res.json(todos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  });

  app.post("/api/todos", (req, res) => {
    try {
      const { title } = req.body;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ error: "Title is required" });
      }
      const stmt = db.prepare("INSERT INTO todos (title) VALUES (?)");
      const info = stmt.run(title);
      const newTodo = db.prepare("SELECT * FROM todos WHERE id = ?").get(info.lastInsertRowid);
      res.status(201).json(newTodo);
    } catch (error) {
      res.status(500).json({ error: "Failed to create todo" });
    }
  });

  app.put("/api/todos/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { title, completed } = req.body;
      
      const current = db.prepare("SELECT * FROM todos WHERE id = ?").get(id) as any;
      if (!current) {
        return res.status(404).json({ error: "Todo not found" });
      }

      const newTitle = title !== undefined ? title : current.title;
      const newCompleted = completed !== undefined ? (completed ? 1 : 0) : current.completed;

      const stmt = db.prepare("UPDATE todos SET title = ?, completed = ? WHERE id = ?");
      stmt.run(newTitle, newCompleted, id);
      
      const updatedTodo = db.prepare("SELECT * FROM todos WHERE id = ?").get(id);
      res.json(updatedTodo);
    } catch (error) {
      res.status(500).json({ error: "Failed to update todo" });
    }
  });

  app.delete("/api/todos/:id", (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare("DELETE FROM todos WHERE id = ?");
      stmt.run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete todo" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
