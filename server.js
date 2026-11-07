const express = require("express");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let tasks = [];

app.get("/api/v1/tasks", (req, res) => {
    res.json(tasks);
});

app.post("/api/v1/tasks", (req, res) => {
    const { title, studentId } = req.body ?? {};
    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ message: "title должен быть непустой строкой" });
    }
    const task = {
        id: randomUUID(),
        title: title.trim(),
        completed: false,
        studentId: studentId ? studentId.trim() : "unknown"
    };
    tasks.push(task);
    return res.status(201).json(task);
});

app.delete("/api/v1/tasks/:id", (req, res) => {
    const index = tasks.findIndex(task => task.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ message: "Задача не найдена" });
    }
    tasks.splice(index, 1);
    return res.status(204).end();
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});