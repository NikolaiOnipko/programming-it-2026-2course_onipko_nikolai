import express from "express";
import path from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config(); // Загружаем настройки из .env

const { Pool } = pg;
const app = express();
const PORT = 3000;

// Подключение к базе данных
const pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
});

app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, "public")));

// GET: получаем задачи вместе с именем владельца
app.get("/api/v1/tasks", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.id, t.title, t.completed, u.display_name AS "owner"
            FROM tasks t
            LEFT JOIN users u ON u.id = t.owner_id
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: создаем задачу и пользователя (если его нет)
app.post("/api/v1/tasks", async (req, res) => {
    const { title, studentId } = req.body ?? {};
    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ message: "title должен быть непустой строкой" });
    }

    try {
        // Проверяем, есть ли пользователь, если нет - создаем
        let userRes = await pool.query("SELECT id FROM users WHERE display_name = $1", [studentId]);
        let userId;
        if (userRes.rows.length === 0) {
            userId = randomUUID();
            await pool.query("INSERT INTO users (id, display_name) VALUES ($1, $2)", [userId, studentId]);
        } else {
            userId = userRes.rows[0].id;
        }

        // Создаем задачу
        const taskId = randomUUID();
        const insertRes = await pool.query(
            "INSERT INTO tasks (id, owner_id, title) VALUES ($1, $2, $3) RETURNING id, title, completed",
            [taskId, userId, title.trim()]
        );

        res.status(201).json(insertRes.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE: удаляем задачу
app.delete("/api/v1/tasks/:id", async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING id", [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Задача не найдена" });
        }
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});