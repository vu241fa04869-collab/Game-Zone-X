
const API_URL = "https://gamezone-x-backend.onrender.com/api/games";

const gameGrid = document.getElementById("gameGrid");
const loadingMessage = document.getElementById("loadingMessage");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const retryButton = document.getElementById("retryButton");

let games = [];
let favorites = JSON.parse(localStorage.getItem("gzFavorites") || "[]");
let scores = JSON.parse(localStorage.getItem("gzScores") || "[]");
let player = JSON.parse(localStorage.getItem("gzPlayer") || '{"name":"Player"}');

const fallbackGames = [
    { id: 1, title: "Neon Velocity", name: "Neon Velocity", category: "Racing", description: "Race through glowing city streets.", rating: 4.8, tag: "Speed run", playable: true },
    { id: 2, title: "Shadow Strike", name: "Shadow Strike", category: "Action", description: "Jump into an exciting mission.", rating: 4.9, tag: "Combat", playable: true },
    { id: 3, title: "Wild Frontier", name: "Wild Frontier", category: "Adventure", description: "Explore mysterious worlds and ruins.", rating: 4.7, tag: "Explore", playable: true },
    { id: 4, title: "Puzzle Master", name: "Puzzle Master", category: "Puzzle", description: "Challenge your problem-solving skills.", rating: 4.6, tag: "Brain", playable: true },
    { id: 5, title: "Number Quest", name: "Number Quest", category: "Puzzle", description: "Guess the hidden number.", rating: 4.5, tag: "Logic", playable: true },
    { id: 6, title: "Speed Arena", name: "Speed Arena", category: "Racing", description: "Test your racing skills.", rating: 4.7, tag: "Racing", playable: true },
    { id: 7, title: "Code Breaker", name: "Code Breaker", category: "Puzzle", description: "Crack the secret code.", rating: 4.8, tag: "Challenge", playable: true },
    { id: 8, title: "Treasure Hunt", name: "Treasure Hunt", category: "Adventure", description: "Find hidden treasures.", rating: 4.6, tag: "Quest", playable: true }
];

function saveData() {
    localStorage.setItem("gzFavorites", JSON.stringify(favorites));
    localStorage.setItem("gzScores", JSON.stringify(scores));
    localStorage.setItem("gzPlayer", JSON.stringify(player));
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getGameName(game) {
    return game.title || game.name || "Untitled Game";
}

function getGameId(game, index) {
    return String(game.id ?? game._id ?? getGameName(game) + index);
}

async function loadGames() {
    loadingMessage.textContent = "Connecting to GameZone X server...";
    retryButton.classList.add("hidden");

    // Display fallback games immediately.
    if (!games.length) {
        games = fallbackGames;
        renderGames();
    }

    try {
        const response = await fetch(API_URL, {
            signal: AbortSignal.timeout(12000)
        });

        if (!response.ok) {
            throw new Error("Server returned " + response.status);
        }

        const data = await response.json();
        const receivedGames = Array.isArray(data)
            ? data
            : data.games || data.data || [];

        if (!receivedGames.length) {
            throw new Error("No games received");
        }

        games = receivedGames;
        renderGames();
        loadingMessage.textContent = "All games loaded successfully!";
    } catch (error) {
        console.error("Game loading error:", error);
        loadingMessage.textContent =
            "Unable to connect. Showing available games instead.";
        retryButton.classList.remove("hidden");
        renderGames();
    }
}

function renderGames() {
    const search = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;

    const filteredGames = games.filter(game => {
        const name = getGameName(game).toLowerCase();
        const description = String(game.description || "").toLowerCase();

        const matchesSearch =
            name.includes(search) || description.includes(search);

        const matchesCategory =
            category === "all" || game.category === category;

        return matchesSearch && matchesCategory;
    });

    if (!filteredGames.length) {
        gameGrid.innerHTML = "<p>No games found. Try another search.</p>";
        return;
    }

    gameGrid.innerHTML = filteredGames.map((game, index) => {
        const id = getGameId(game, index);
        const name = getGameName(game);
        const image = game.image || game.imageUrl || "";
        const isFavorite = favorites.includes(id);

        return `
            <article class="game-card">
                ${image
                    ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(name)}" loading="lazy">`
                    : `<div class="game-image-placeholder"></div>`
                }
                <div class="game-card-content">
                    <h3>${escapeHTML(name)}</h3>
                    <p>${escapeHTML(game.description || "Explore this exciting game.")}</p>
                    <span class="category">${escapeHTML(game.category || "Game")}</span>
                    <span class="rating">⭐ ${escapeHTML(game.rating || "4.5")}</span>
                    <span class="tag">${escapeHTML(game.tag || "Featured")}</span>
                    <div>
                        <button class="btn play-button" data-id="${escapeHTML(id)}">Play Now</button>
                        <button class="btn favorite-button" data-id="${escapeHTML(id)}">
                            ${isFavorite ? "♥ Saved" : "♡ Favourite"}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

gameGrid.addEventListener("click", event => {
    const playButton = event.target.closest(".play-button");
    const favoriteButton = event.target.closest(".favorite-button");

    if (favoriteButton) {
        const id = favoriteButton.dataset.id;

        if (favorites.includes(id)) {
            favorites = favorites.filter(item => item !== id);
        } else {
            favorites.push(id);
        }

        saveData();
        renderGames();
        renderProfile();
    }

    if (playButton) {
        const game = games.find((item, index) =>
            getGameId(item, index) === playButton.dataset.id
        );

        if (game) openGame(game);
    }
});

searchInput.addEventListener("input", renderGames);
categoryFilter.addEventListener("change", renderGames);
retryButton.addEventListener("click", loadGames);

// PLAYER PROFILE

function renderProfile() {
    const name = player.name || "Player";

    document.getElementById("playerName").textContent = name;
    document.getElementById("playerAvatar").textContent =
        name.charAt(0).toUpperCase();

    const bestScore = scores.length
        ? Math.max(...scores.map(item => item.score))
        : 0;

    document.getElementById("playerStats").textContent =
        `Games played: ${scores.length} | Best score: ${bestScore} | Favourites: ${favorites.length}`;

    document.getElementById("profileNameInput").value = name;
}

document.getElementById("saveProfileButton").addEventListener("click", () => {
    const input = document.getElementById("profileNameInput");
    const name = input.value.trim();

    if (!name) {
        alert("Please enter a player name.");
        return;
    }

    player.name = name.slice(0, 20);
    saveData();
    renderProfile();
    alert("Profile saved successfully!");
});

// SCORE TRACKING

function saveScore(gameName, score) {
    scores.push({
        player: player.name || "Player",
        game: gameName,
        score: Number(score),
        date: new Date().toISOString()
    });

    saveData();
    renderLeaderboard();
    renderProfile();
}

function renderLeaderboard() {
    const leaderboard = document.getElementById("leaderboardList");

    const bestScores = {};

    scores.forEach(item => {
        const key = item.player + "|" + item.game;

        if (!bestScores[key] || item.score > bestScores[key].score) {
            bestScores[key] = item;
        }
    });

    const sorted = Object.values(bestScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    if (!sorted.length) {
        leaderboard.innerHTML = "<p>No scores yet. Play a game to appear here!</p>";
        return;
    }

    leaderboard.innerHTML = sorted.map((item, index) => `
        <div class="leaderboard-item">
            <span>#${index + 1} ${escapeHTML(item.player)}</span>
            <span>${escapeHTML(item.game)}</span>
            <strong>${item.score} pts</strong>
        </div>
    `).join("");
}

// GAME WINDOW

function openGame(game) {
    const name = getGameName(game);

    const oldModal = document.getElementById("gameModal");
    if (oldModal) oldModal.remove();

    const modal = document.createElement("div");
    modal.id = "gameModal";

    modal.style.cssText = `
        position:fixed; inset:0; z-index:9999;
        background:rgba(0,0,0,.9); display:flex;
        align-items:center; justify-content:center;
        padding:15px; overflow:auto;
    `;

    modal.innerHTML = `
        <div style="background:#11182a;color:white;padding:25px;
        border:1px solid #00eaff;border-radius:15px;
        width:100%;max-width:500px;text-align:center;">
            <button id="closeGame" style="float:right;padding:7px 12px;
            cursor:pointer;">✕</button>
            <h2>${escapeHTML(name)}</h2>
            <div id="gameContent" style="padding:25px 0;"></div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeGame").onclick = () => modal.remove();

    const content = document.getElementById("gameContent");

    if (name.toLowerCase().includes("number")) {
        numberGame(content, name);
    } else if (name.toLowerCase().includes("puzzle")) {
        puzzleGame(content, name);
    } else if (name.toLowerCase().includes("code")) {
        numberGame(content, name);
    } else {
        simpleGame(content, name);
    }
}

// NUMBER GUESSING GAME

function numberGame(container, name) {
    const answer = Math.floor(Math.random() * 10) + 1;
    let attempts = 0;

    container.innerHTML = `
        <p>Guess a number between 1 and 10.</p>
        <input id="guessInput" type="number" min="1" max="10"
        placeholder="Enter number">
        <button class="btn" id="guessButton">Guess</button>
        <p id="guessMessage"></p>
    `;

    document.getElementById("guessButton").onclick = () => {
        const guess = Number(document.getElementById("guessInput").value);
        const message = document.getElementById("guessMessage");

        if (!Number.isInteger(guess) || guess < 1 || guess > 10) {
            message.textContent = "Enter a number from 1 to 10.";
            return;
        }

        attempts++;

        if (guess === answer) {
            const score = Math.max(10, 110 - attempts * 10);
            message.textContent = `Correct! Your score: ${score}`;
            saveScore(name, score);
            document.getElementById("guessButton").disabled = true;
        } else {
            message.textContent = guess < answer ? "Try a higher number!" : "Try a lower number!";
        }
    };
}

// PUZZLE GAME

function puzzleGame(container, name) {
    const numbers = [1, 2, 3, 4, 5, 6];
    let selected = null;
    let matched = [];

    const shuffled = [...numbers, ...numbers]
        .sort(() => Math.random() - 0.5);

    container.innerHTML = `
        <p>Match all the number pairs!</p>
        <div id="puzzleBoard" style="display:grid;
        grid-template-columns:repeat(4,1fr);gap:10px;"></div>
        <p id="puzzleMessage"></p>
    `;

    const board = document.getElementById("puzzleBoard");

    shuffled.forEach((number, index) => {
        const button = document.createElement("button");
        button.textContent = "?";
        button.style.cssText =
            "padding:18px 5px;font-size:20px;background:#19233a;color:white;border:1px solid #00eaff;border-radius:8px;";

        button.onclick = () => {
            if (button.disabled || matched.includes(index)) return;

            button.textContent = number;

            if (selected === null) {
                selected = { number, index, button };
                return;
            }

            const first = selected;
            selected = null;

            if (first.index === index) return;

            if (first.number === number) {
                matched.push(first.index, index);
                first.button.disabled = true;
                button.disabled = true;

                if (matched.length === 12) {
                    document.getElementById("puzzleMessage").textContent =
                        "Congratulations! You completed the puzzle!";
                    saveScore(name, 100);
                }
            } else {
                setTimeout(() => {
                    first.button.textContent = "?";
                    button.textContent = "?";
                }, 700);
            }
        };

        board.appendChild(button);
    });
}

// SIMPLE CHALLENGE GAME

function simpleGame(container, name) {
    let time = 15;
    let points = 0;
    let finished = false;

    container.innerHTML = `
        <p>Click the button as many times as possible in 15 seconds!</p>
        <h3 id="gameTimer">Time: 15</h3>
        <h3 id="gamePoints">Score: 0</h3>
        <button class="btn" id="clickGameButton">CLICK ME!</button>
        <p id="simpleMessage"></p>
    `;

    document.getElementById("clickGameButton").onclick = () => {
        if (finished) return;

        points += 10;
        document.getElementById("gamePoints").textContent =
            "Score: " + points;
    };

    const timer = setInterval(() => {
        time--;
        document.getElementById("gameTimer").textContent =
            "Time: " + time;

        if (time <= 0) {
            clearInterval(timer);
            finished = true;

            document.getElementById("clickGameButton").disabled = true;
            document.getElementById("simpleMessage").textContent =
                "Game finished! Your score: " + points;

            saveScore(name, points);
        }
    }, 1000);

    document.getElementById("closeGame").addEventListener("click", () => {
        clearInterval(timer);
    }, { once: true });
}

// INITIALIZE

renderProfile();
renderLeaderboard();
loadGames();
