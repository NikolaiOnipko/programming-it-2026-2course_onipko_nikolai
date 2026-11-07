const API_URL = "https://6ac64b73bea0e72cf5c8d494.mockapi.io/api/v1/tasks"; 
const STUDENT_ID = "onipko-nikolai";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-title");
const list = document.querySelector("#task-list");

async function loadTasks() {
    list.innerHTML = "<li>Загрузка...</li>";
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Ошибка загрузки");
        const tasks = await response.json();
        const myTasks = tasks.filter(task => task.studentId === STUDENT_ID);
        
        list.innerHTML = "";
        if (myTasks.length === 0) {
            list.innerHTML = "<li>Нет задач</li>";
            return;
        }
        myTasks.forEach(task => {
            const item = document.createElement("li");
            item.textContent = task.title;
            list.appendChild(item);
        });
    } catch (error) {
        list.innerHTML = `<li style="color:red">Ошибка: ${error.message}</li>`;
    }
}

async function createTask(title) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title, completed: false, studentId: STUDENT_ID })
    });
    if (!response.ok) throw new Error("Не удалось создать задачу");
    return response.json();
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = input.value.trim();
    if (!title) return;

    try {
        await createTask(title);
        input.value = ""; 
        await loadTasks(); 
    } catch (error) {
        alert("Ошибка при создании задачи: " + error.message);
    }
});

loadTasks();