// Состояние приложения
let allLetters = [];
let currentFilter = '';

// DOM элементы
const lettersList = document.getElementById('lettersList');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');
const statsSpan = document.getElementById('stats');

// Базовый URL для API
const API_BASE_URL = 'http://localhost:3000/api';

// Загрузка писем с бэкенда
async function loadLetters() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/letters`);

        if (!response.ok) {
            throw new Error('Ошибка загрузки');
        }

        const data = await response.json();
        allLetters = data.letters;
        renderLetters(allLetters);
        updateStats(allLetters.length, allLetters.length);
    } catch (error) {
        console.error('Ошибка:', error);
        lettersList.innerHTML = '<div class="no-results">❌ Не удалось загрузить письма. Убедитесь, что сервер запущен.</div>';
    }
}

// Показать индикатор загрузки
function showLoading() {
    lettersList.innerHTML = '<div class="loading">📚 Загрузка писем Чехова...</div>';
}

// Обновить статистику
function updateStats(shown, total) {
    if (shown === total) {
        statsSpan.textContent = `Всего писем: ${total}`;
    } else {
        statsSpan.textContent = `Показано: ${shown} из ${total}`;
    }
}

// Функция подсветки найденного текста
function highlightText(text, query) {
    if (!query || query.trim() === '') return text;

    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark class="highlight">$1</mark>');
}

// Экранирование спецсимволов для regex
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Отрисовка писем
function renderLetters(letters, searchQuery = '') {
    if (!letters || letters.length === 0) {
        lettersList.innerHTML = '<div class="no-results">📭 Писем по вашему запросу не найдено.</div>';
        updateStats(0, allLetters.length);
        return;
    }

    const lettersHtml = letters.map(letter => {
        let textToDisplay = letter.text;
        let recipientToDisplay = letter.recipient;

        if (searchQuery) {
            textToDisplay = highlightText(letter.text, searchQuery);
            recipientToDisplay = highlightText(letter.recipient, searchQuery);
        }

        return `
            <div class="letter-card">
                <div class="letter-header">
                    <span class="recipient">${recipientToDisplay}</span>
                    <span class="date">${letter.date}</span>
                </div>
                <div class="letter-text">${textToDisplay}</div>
                <div class="tags">
                    ${letter.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }).join('');

    lettersList.innerHTML = lettersHtml;
    updateStats(letters.length, allLetters.length);
}

// Поиск на клиенте (с сохранением пунктуации)
function searchLetters(query) {
    if (!query || query.trim() === '') {
        renderLetters(allLetters);
        currentFilter = '';
        return;
    }

    const lowerQuery = query.toLowerCase().trim();

    const filtered = allLetters.filter(letter =>
        letter.text.toLowerCase().includes(lowerQuery) ||
        letter.recipient.toLowerCase().includes(lowerQuery) ||
        letter.date.includes(lowerQuery) ||
        letter.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );

    renderLetters(filtered, query);
    currentFilter = query;
}

// Поиск через API бэкенда (альтернативный вариант с серверным поиском)
async function searchOnServer(query) {
    if (!query || query.trim() === '') {
        loadLetters();
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(query)}`);
        const data = await response.json();
        renderLetters(data.results, query);
        updateStats(data.count, allLetters.length);
    } catch (error) {
        console.error('Ошибка поиска:', error);
        lettersList.innerHTML = '<div class="no-results">❌ Ошибка при поиске</div>';
    }
}

// Сброс фильтров
function resetSearch() {
    searchInput.value = '';
    loadLetters();
    currentFilter = '';
}

// Обработчики событий
searchBtn.addEventListener('click', () => {
    const query = searchInput.value;
    searchLetters(query);
    // Или использовать серверный поиск: searchOnServer(query);
});

resetBtn.addEventListener('click', resetSearch);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchLetters(searchInput.value);
    }
});

// Инициализация приложения
loadLetters();