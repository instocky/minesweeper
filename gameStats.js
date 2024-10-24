const GameStats = (function () {
    // Константы
    const STORAGE_KEY = 'dailyStats';

    // Структура статистики
    const defaultStats = {
        date: null,
        gamesPlayed: 0,
        gamesWon: 0,
        totalPlayTime: 0,
        lastGameStartTime: null
    };

    // Приватные методы
    function getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    function formatPlayTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}ч ${minutes}мин`;
        }
        return `${minutes}мин`;
    }

    function calculateWinRate(stats) {
        if (stats.gamesPlayed === 0) return 0;
        return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
    }

    function getStoredStats() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    function saveStats(stats) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }

    // Публичные методы
    return {
        initDailyStats: function () {
            const currentDate = getCurrentDate();
            let stats = getStoredStats();

            // Сброс статистики при новом дне или её отсутствии
            if (!stats || stats.date !== currentDate) {
                stats = { ...defaultStats, date: currentDate };
                saveStats(stats);
            }

            this.renderStats();
            return stats;
        },

        startGame: function () {
            const stats = getStoredStats();
            stats.lastGameStartTime = Date.now();
            stats.gamesPlayed += 1;
            saveStats(stats);
        },

        endGame: function (isWin) {
            const stats = getStoredStats();
            const gameTime = Math.floor((Date.now() - stats.lastGameStartTime) / 1000);

            stats.totalPlayTime += gameTime;
            if (isWin) {
                stats.gamesWon += 1;
            }

            saveStats(stats);
            this.renderStats();
        },

        renderStats: function () {
            const stats = getStoredStats();
            if (!stats) return;

            const winRate = calculateWinRate(stats);
            const playTime = formatPlayTime(stats.totalPlayTime);

            // Создаём или обновляем блок статистики
            let statsBlock = document.getElementById('dailyStats');
            if (!statsBlock) {
                statsBlock = document.createElement('div');
                statsBlock.id = 'dailyStats';
                statsBlock.className = 'stats-block';
                document.querySelector('#game').after(statsBlock);
            }

            statsBlock.innerHTML = `
                <div class="stats-content">
                    <p>Сегодня сыграно: ${stats.gamesPlayed}</p>
                    <p>Побед: ${winRate}% (${stats.gamesWon}/${stats.gamesPlayed})</p>
                    <p>Время в игре: ${playTime}</p>
                </div>
            `;
        }
    };
})();