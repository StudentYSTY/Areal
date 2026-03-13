const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname)); // ✅ Раздача статики из корня проекта

const DB_PATH = path.join(__dirname, 'db.json');

// Вспомогательные функции для работы с БД
const readDB = () => {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
};

const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// 1. Получить всех сотрудников
app.get('/api/employees', (req, res) => {
    const db = readDB();
    res.json(db.employees);
});

// 2. Создать сотрудника
app.post('/api/employees', (req, res) => {
    const db = readDB();
    const newEmployee = {
        id: Date.now(),
        isFired: false,
        ...req.body
    };
    db.employees.push(newEmployee);
    writeDB(db);
    res.json(newEmployee);
});

// 3. Редактировать сотрудника
app.put('/api/employees/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.employees.findIndex(emp => emp.id === id);

    if (index === -1) return res.status(404).json({ error: 'Сотрудник не найден' });

    if (db.employees[index].isFired) {
        return res.status(403).json({ error: 'Редактирование уволенных запрещено' });
    }

    db.employees[index] = { ...db.employees[index], ...req.body };
    writeDB(db);
    res.json(db.employees[index]);
});

// 4. Уволить сотрудника (Soft Delete)
app.patch('/api/employees/:id/fire', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const employee = db.employees.find(emp => emp.id === id);

    if (employee) {
        employee.isFired = true;
        writeDB(db);
        res.json(employee);
    } else {
        res.status(404).json({ error: 'Сотрудник не найден' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});