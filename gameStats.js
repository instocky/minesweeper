const GameStats = (function () {
    // Константы
    const STORAGE_KEY = 'dailyStats';

    // Структура статистики по умолчанию
    const defaultStats = {
        date: null,
        gamesPlayed: 0,
        gamesWon: 0,
        totalPlayTime: 0,
        lastGameStartTime: null,
        currentGameMoves: {
            left: 0,
            right: 0
        },
        games: []
    };

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

    function getBestGame(games) {
        if (!games || games.length === 0) return null;

        const winningGames = games.filter(game => game.result === "win");
        if (winningGames.length === 0) return null;

        return winningGames.reduce((best, current) => {
            const bestTotal = best.moves.left + best.moves.right;
            const currentTotal = current.moves.left + current.moves.right;
            return currentTotal < bestTotal ? current : best;
        }, winningGames[0]);
    }

    function getStoredStats() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const stats = JSON.parse(stored);
        // Убедимся, что структура данных полная
        if (!stats.currentGameMoves) {
            stats.currentGameMoves = { left: 0, right: 0 };
        }
        if (!stats.games) {
            stats.games = [];
        }
        return stats;
    }

    function saveStats(stats) {
        // Убедимся, что все необходимые поля существуют
        const completeStats = {
            ...defaultStats,
            ...stats,
            currentGameMoves: {
                left: stats.currentGameMoves?.left || 0,
                right: stats.currentGameMoves?.right || 0
            },
            games: stats.games || []
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completeStats));
    }

    // Публичные методы
    return {
        initDailyStats: function () {
            const currentDate = getCurrentDate();
            let stats = getStoredStats();

            if (!stats || stats.date !== currentDate) {
                stats = {
                    ...defaultStats,
                    date: currentDate,
                    currentGameMoves: { left: 0, right: 0 },
                    games: []
                };
            }

            saveStats(stats);
            this.renderStats();
            return stats;
        },

        startGame: function () {
            let stats = getStoredStats();
            if (!stats) {
                stats = this.initDailyStats();
            }

            stats.lastGameStartTime = Date.now();
            stats.gamesPlayed += 1;
            stats.currentGameMoves = { left: 0, right: 0 };

            saveStats(stats);
            this.renderStats();
        },

        endGame: function (isWin) {
            let stats = getStoredStats();
            if (!stats) return;

            const gameTime = Math.floor((Date.now() - stats.lastGameStartTime) / 1000);
            stats.totalPlayTime += gameTime;

            // Сохраняем игру в историю
            stats.games.push({
                moves: { ...stats.currentGameMoves },
                result: isWin ? "win" : "lose",
                duration: gameTime
            });

            if (isWin) {
                stats.gamesWon += 1;
            }

            saveStats(stats);
            this.renderStats();
        },

        registerMove: function (direction) {
            let stats = getStoredStats();
            if (!stats) {
                stats = this.initDailyStats();
            }

            if (!stats.currentGameMoves) {
                stats.currentGameMoves = { left: 0, right: 0 };
            }

            if (direction === 'left') {
                stats.currentGameMoves.left += 1;
            } else if (direction === 'right') {
                stats.currentGameMoves.right += 1;
            }

            saveStats(stats);
            this.renderStats();
        },

        renderStats: function () {
            const stats = getStoredStats();
            if (!stats) return;

            const winRate = calculateWinRate(stats);
            const playTime = formatPlayTime(stats.totalPlayTime);
            const totalMoves = stats.currentGameMoves.left + stats.currentGameMoves.right;

            // Получаем лучшую игру
            const bestGame = getBestGame(stats.games);
            const bestMoves = bestGame ?
                ` | ${bestGame.moves.left}/${bestGame.moves.right}(${bestGame.moves.left + bestGame.moves.right})` :
                '';

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
                    <p>Число ходов: ${stats.currentGameMoves.left}/${stats.currentGameMoves.right}(${totalMoves})${bestMoves}</p>
                </div>
            `;
        }
    };
})();