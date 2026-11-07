import express from "express";
import path from "node:path";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";

const app = express();
const PORT = 3000;
// Файл, в котором будут храниться задачи
const DATA_FILE = path.join(import.meta.dirname, "tasks.json"); 

app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, "public")));

// Функция чтения задач из файла
async function loadTasks() {
    try {
        const text = await fs.readFile(DATA_FILE, "utf8");
        return JSON.parse(text);
    } catch (error) {
        if (error.code === "ENOENT") return []; // Если файла еще нет - возвращаем пустой массив
        throw error;
    }
}

// Функция сохранения задач в файл
async function saveTasks(nextTasks) {
    const text = JSON.stringify(nextTasks, null, 2);
    await fs.writeFile(DATA_FILE, text, "utf8");
}

app.get("/api/v1/tasks", async (req, res) => {
    const tasks = await loadTasks();
    res.json(tasks);
});

app.post("/api/v1/tasks", async (req, res) => {
    const { title, studentId } = req.body ?? {};
    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ message: "title должен быть непустой строкой" });
    }

    const tasks = await loadTasks();
    const task = {
        id: randomUUID(),
        title: title.trim(),
        completed: false,
        studentId: studentId ? studentId.trim() : "unknown"
    };
    
    const nextTasks = [...tasks, task];
    await saveTasks(nextTasks); // Сначала сохраняем на диск
    return res.status(201).json(task); // Потом отвечаем клиенту
});

app.delete("/api/v1/tasks/:id", async (req, res) => {
    const tasks = await loadTasks();
    const nextTasks = tasks.filter(task => task.id !== req.params.id);
    
    if (tasks.length === nextTasks.length) {
        return res.status(404).json({ message: "Задача не найдена" });
    }
    
    await saveTasks(nextTasks); // Сохраняем обновленный список
    return res.status(204).end();
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});