const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Раздача статики из папки frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Загрузка корпуса писем из JSON
const lettersPath = path.join(__dirname, 'data', 'letters.json');
let lettersCache = null;

function loadLetters() {
    try {
        if (!lettersCache) {
            const data = fs.readFileSync(lettersPath, 'utf8');
            lettersCache = JSON.parse(data);
        }
        return lettersCache;
    } catch (error) {
        console.error('Ошибка загрузки писем:', error);
        return { letters: [] };
    }
}

// API маршруты
app.get('/api/letters', (req, res) => {
    const letters = loadLetters();
    res.json(letters);
});

app.get('/api/letters/:id', (req, res) => {
    const letters = loadLetters();
    const letter = letters.letters.find(l => l.id === parseInt(req.params.id));
    
    if (letter) {
        res.json(letter);
    } else {
        res.status(404).json({ error: 'Письмо не найдено' });
    }
});

app.get('/api/search/:query', (req, res) => {
    const letters = loadLetters();
    const query = req.params.query.toLowerCase();
    
    const results = letters.letters.filter(letter => 
        letter.text.toLowerCase().includes(query) ||
        letter.recipient.toLowerCase().includes(query) ||
        letter.date.includes(query) ||
        letter.tags.some(tag => tag.toLowerCase().includes(query))
    );
    
    res.json({ results, count: results.length });
});

// Отдача HTML для всех остальных маршрутов (исправленная версия)
app.use((req, res, next) => {
    // Если это не API запрос и не запрос к статическим файлам
    if (!req.path.startsWith('/api') && !req.path.match(/\.(css|js|json|png|jpg|jpeg|gif|svg|ico)$/)) {
        res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
    } else {
        next();
    }
});

app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});