let games = [];

async function loadGames() {
  try {
    const response = await fetch("https://gamezone-x-backend.onrender.com/api/games");

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    games = await response.json();
    renderGames();
  } catch (error) {
    console.error("Failed to load games:", error);
    showToast("Could not load games. Check whether the backend is running.");
  }
}

const gameGrid = document.getElementById("gameGrid");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const favoriteCountStat = document.getElementById("favoriteCountStat");
const toast = document.getElementById("toast");

let activeFilter = "All";
let favorites = new Set();

try {
  favorites = new Set(
    JSON.parse(localStorage.getItem("gamezone-favorites") || "[]")
  );
} catch (error) {
  favorites = new Set();
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2300);
}

function updateFavoriteCount() {
  if (favoriteCountStat) {
    favoriteCountStat.textContent =
      String(favorites.size).padStart(2, "0");
  }
}

function renderGames() {
  if (!gameGrid || !searchInput) return;

  const searchTerm = searchInput.value.trim().toLowerCase();

  const filteredGames = games.filter(game => {
    const matchesCategory =
      activeFilter === "All" || game.genre === activeFilter;

    const matchesSearch =
      `${game.title} ${game.genre} ${game.description}`
        .toLowerCase()
        .includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  gameGrid.innerHTML = filteredGames.map(game => {
    const isFavorite = favorites.has(game.id);

    return `
      <article class="game-card">
        <div class="game-cover">
          <img
            src="${game.image}"
            alt="${game.title}"
            loading="lazy"
          />

          <span class="genre-pill">${game.genre}</span>

          <button
            class="favorite-button ${isFavorite ? "is-favorite" : ""}"
            data-favorite="${game.id}"
            aria-label="Toggle favorite"
            aria-pressed="${isFavorite}"
          >${isFavorite ? "♥" : "♡"}</button>
        </div>

        <div class="game-info">
          <div class="game-title-row">
            <h3>${game.title}</h3>
            <span class="rating">★ ${game.rating}</span>
          </div>

          <p>${game.description}</p>

          <div class="game-bottom">
            <span class="game-tag">${game.tag}</span>

            <button class="play-button" data-play="${game.id}">
              Play now ↗
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  if (emptyState) {
    emptyState.classList.toggle("hidden", filteredGames.length > 0);
  }

  const gameCount = document.getElementById("gameCountStat");

  if (gameCount) {
    gameCount.textContent = String(games.length).padStart(2, "0");
  }

  updateFavoriteCount();
}

document.querySelectorAll(".filter-chip").forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    document.querySelectorAll(".filter-chip").forEach(chip => {
      chip.classList.toggle("selected", chip === button);
    });

    renderGames();
  });
});

if (searchInput) {
  searchInput.addEventListener("input", renderGames);
}

if (gameGrid) {
  gameGrid.addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite]");
    const playButton = event.target.closest("[data-play]");

    if (favoriteButton) {
      const id = Number(favoriteButton.dataset.favorite);

      if (favorites.has(id)) {
        favorites.delete(id);
        showToast("Removed from favorites.");
      } else {
        favorites.add(id);
        showToast("Added to favorites! ♥");
      }

      try {
        localStorage.setItem(
          "gamezone-favorites",
          JSON.stringify([...favorites])
        );
      } catch (error) {
        console.warn("Favorites could not be saved.", error);
      }

      renderGames();
    }

    if (playButton) {
      const game = games.find(
        item => item.id === Number(playButton.dataset.play)
      );

      if (game) openPlayableGame(game);
    }
  });
}

let activeGameCleanup = null;

function openPlayableGame(game) {
  closePlayableGame();

  const modal = document.createElement("div");
  modal.id = "playableGameModal";

  modal.innerHTML = `
    <div class="play-backdrop"></div>

    <section class="play-panel" role="dialog" aria-modal="true">
      <button class="play-close" aria-label="Close game">×</button>

      <p class="play-kicker">${game.genre} GAME</p>
      <h2>${game.title}</h2>
      <p class="play-description">${game.description}</p>

      <div class="play-stage" id="playStage"></div>
      <p class="play-message" id="playMessage"></p>

      <button class="play-restart" id="playRestart">
        Restart Game
      </button>
    </section>
  `;

  if (!document.getElementById("playStyles")) {
    const style = document.createElement("style");
    style.id = "playStyles";

    style.textContent = `
      #playableGameModal {
        position:fixed;
        inset:0;
        z-index:99999;
        display:grid;
        place-items:center;
        padding:15px;
        font-family:inherit;
      }

      .play-backdrop {
        position:absolute;
        inset:0;
        background:rgba(4,3,12,.9);
        backdrop-filter:blur(8px);
      }

      .play-panel {
        position:relative;
        width:min(680px,100%);
        max-height:92vh;
        overflow:auto;
        padding:25px;
        border:1px solid #783bd0;
        border-radius:20px;
        background:#121020;
        color:#fff;
        box-shadow:0 20px 80px #0009;
      }

      .play-close {
        float:right;
        width:38px;
        height:38px;
        border-radius:50%;
        background:#252035;
        color:white;
        border:1px solid #514265;
        font-size:25px;
        cursor:pointer;
      }

      .play-kicker {
        color:#42e8f5;
        font-weight:bold;
        letter-spacing:2px;
      }

      .play-panel h2 {
        margin:5px 0;
        font-size:30px;
      }

      .play-description,
      .play-message {
        color:#c6bddf;
      }

      .play-stage {
        min-height:230px;
        padding:20px;
        border-radius:15px;
        border:1px solid #35294a;
        background:#090814;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:14px;
        text-align:center;
      }

      .play-btn,
      .play-restart {
        padding:11px 17px;
        border:0;
        border-radius:10px;
        background:linear-gradient(120deg,#853ee6,#d02ebd);
        color:white;
        font-weight:bold;
        cursor:pointer;
      }

      .play-row {
        display:flex;
        flex-wrap:wrap;
        justify-content:center;
        gap:10px;
      }

      .play-score {
        font-size:19px;
        color:#42e8f5;
        font-weight:bold;
      }

      .play-track {
        position:relative;
        width:260px;
        max-width:100%;
        height:190px;
        overflow:hidden;
        border:2px solid #55436e;
        border-radius:12px;
        background:repeating-linear-gradient(
          0deg,#171523 0 28px,#252136 28px 56px
        );
      }

      .play-car {
        position:absolute;
        bottom:12px;
        width:34px;
        height:45px;
        border-radius:9px;
        background:#f5cf35;
        box-shadow:0 0 18px #f5cf3588;
      }

      .play-obstacle {
        position:absolute;
        top:-35px;
        width:30px;
        height:35px;
        border-radius:7px;
        background:#f04f82;
      }

      .play-target {
        width:75px;
        height:75px;
        border:2px solid #42e8f5;
        border-radius:50%;
        background:#201b30;
        color:white;
        font-size:34px;
        cursor:pointer;
      }

      .memory-card {
        width:62px;
        height:62px;
        border:1px solid #634b86;
        border-radius:10px;
        background:#201b30;
        color:white;
        font-size:25px;
        cursor:pointer;
      }

      .memory-grid {
        display:grid;
        grid-template-columns:repeat(4,62px);
        gap:8px;
      }

      .story-choice {
        width:100%;
        max-width:380px;
      }

      @media(max-width:450px) {
        .play-panel { padding:17px; }
        .memory-grid { grid-template-columns:repeat(4,52px); }
        .memory-card { width:52px;height:52px; }
      }
    `;

    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  const stage = modal.querySelector("#playStage");
  const message = modal.querySelector("#playMessage");
  let cleanup = () => {};

  function close() {
    cleanup();
    modal.remove();
    document.removeEventListener("keydown", escapeHandler);
    if (activeGameCleanup === close) activeGameCleanup = null;
  }

  function escapeHandler(event) {
    if (event.key === "Escape") close();
  }

  modal.querySelector(".play-close").addEventListener("click", close);
  modal.querySelector(".play-backdrop").addEventListener("click", close);
  document.addEventListener("keydown", escapeHandler);
  activeGameCleanup = close;

  function makeButton(text, callback) {
    const button = document.createElement("button");
    button.className = "play-btn";
    button.textContent = text;
    button.addEventListener("click", callback);
    return button;
  }

  function startGame() {
    cleanup();
    cleanup = () => {};
    stage.innerHTML = "";
    message.textContent = "";

    if (game.genre === "Racing") {
      let lane = 1;
      let score = 0;
      let running = true;
      const timers = [];
      const scoreLabel = document.createElement("div");
      scoreLabel.className = "play-score";

      const track = document.createElement("div");
      track.className = "play-track";

      const car = document.createElement("div");
      car.className = "play-car";
      track.appendChild(car);

      function move(delta) {
        if (!running) return;
        lane = Math.max(0, Math.min(2, lane + delta));
        car.style.left = `calc(${lane * 33.333 + 16.666}% - 17px)`;
      }

      function keyHandler(event) {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }

      document.addEventListener("keydown", keyHandler);

      const controls = document.createElement("div");
      controls.className = "play-row";
      controls.append(
        makeButton("← Left", () => move(-1)),
        makeButton("Right →", () => move(1))
      );

      stage.append(scoreLabel, track, controls);
      move(0);

      timers.push(setInterval(() => {
        if (!running) return;
        score++;
        scoreLabel.textContent = `Distance: ${score}`;

        const obstacle = document.createElement("div");
        obstacle.className = "play-obstacle";
        const obstacleLane = Math.floor(Math.random() * 3);
        obstacle.style.left =
          `calc(${obstacleLane * 33.333 + 16.666}% - 15px)`;
        track.appendChild(obstacle);

        let y = -35;

        const fallTimer = setInterval(() => {
          if (!running) {
            clearInterval(fallTimer);
            obstacle.remove();
            return;
          }

          y += 5;
          obstacle.style.top = y + "px";

          if (y > 115 && y < 160 && obstacleLane === lane) {
            running = false;
            clearInterval(fallTimer);
            timers.forEach(clearInterval);
            message.textContent =
              `Crash! You travelled ${score} points. Restart to race again.`;
          } else if (y > 200) {
            clearInterval(fallTimer);
            obstacle.remove();
          }
        }, 45);

        timers.push(fallTimer);
      }, 900));

      cleanup = () => {
        running = false;
        timers.forEach(clearInterval);
        document.removeEventListener("keydown", keyHandler);
      };

      message.textContent =
        "Avoid the pink obstacles with the arrow keys or buttons.";
      return;
    }

    if (game.genre === "Action") {
      let score = 0;
      let seconds = 15;

      const scoreLabel = document.createElement("div");
      scoreLabel.className = "play-score";

      const target = document.createElement("button");
      target.className = "play-target";
      target.textContent = "✦";

      const instructions = document.createElement("p");
      instructions.textContent = "Click the target as many times as possible!";

      function update() {
        scoreLabel.textContent = `Score: ${score} | Time: ${seconds}s`;
      }

      target.addEventListener("click", () => {
        if (seconds <= 0) return;
        score++;
        target.style.transform =
          `translate(${Math.random() * 70 - 35}px,${Math.random() * 20 - 10}px)`;
        update();
      });

      stage.append(scoreLabel, target, instructions);
      update();

      const timer = setInterval(() => {
        seconds--;
        update();

        if (seconds <= 0) {
          clearInterval(timer);
          target.disabled = true;
          instructions.textContent = `Time is up! Final score: ${score}`;
        }
      }, 1000);

      cleanup = () => clearInterval(timer);
      message.textContent = "You have 15 seconds. Be quick!";
      return;
    }

    if (game.genre === "Puzzle") {
      const symbols = ["★","●","▲","◆","☀","☂",
                       "★","●","▲","◆","☀","☂"];

      for (let i = symbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
      }

      let firstCard = null;
      let locked = false;
      let pairs = 0;
      const timers = new Set();

      const score = document.createElement("div");
      score.className = "play-score";
      score.textContent = "Pairs: 0 / 6";

      const grid = document.createElement("div");
      grid.className = "memory-grid";

      symbols.forEach(symbol => {
        const card = document.createElement("button");
        card.className = "memory-card";
        card.textContent = "?";

        card.addEventListener("click", () => {
          if (locked || card.dataset.open === "yes") return;

          card.textContent = symbol;
          card.dataset.open = "yes";

          if (!firstCard) {
            firstCard = { card, symbol };
            return;
          }

          if (firstCard.symbol === symbol) {
            pairs++;
            firstCard = null;
            score.textContent = `Pairs: ${pairs} / 6`;

            if (pairs === 6) {
              message.textContent = "🎉 Puzzle solved! You won!";
            }
          } else {
            locked = true;
            const previous = firstCard.card;
            firstCard = null;

            const timer = setTimeout(() => {
              timers.delete(timer);
              if (!modal.isConnected) return;

              previous.textContent = "?";
              card.textContent = "?";
              previous.dataset.open = "";
              card.dataset.open = "";
              locked = false;
            }, 700);

            timers.add(timer);
          }
        });

        grid.appendChild(card);
      });

      stage.append(score, grid);
      message.textContent = "Find the matching pairs of symbols.";

      cleanup = () => {
        locked = true;
        timers.forEach(clearTimeout);
        timers.clear();
      };
      return;
    }

    let step = 0;

    const story = [
      {
        text: "You arrive at a mysterious gate. Which path will you take?",
        choices: [
          ["Enter the forest", "You discover a hidden treasure chest! ✨"],
          ["Cross the bridge", "You find an ancient map! 🗺️"]
        ]
      },
      {
        text: "A guardian blocks your way. What will you do?",
        choices: [
          ["Solve its riddle", "The guardian lets you pass! 🏆"],
          ["Offer a shiny coin", "The guardian smiles and opens the gate! 🎉"]
        ]
      },
      {
        text: "You found the lost relic. Adventure complete!",
        choices: [["Play again", "restart"]]
      }
    ];

    function showStory() {
      stage.innerHTML = "";

      const text = document.createElement("p");
      text.textContent = story[step].text;
      text.style.fontSize = "18px";
      stage.appendChild(text);

      story[step].choices.forEach(([label, result]) => {
        const choice = makeButton(label, () => {
          if (result === "restart") {
            step = 0;
            message.textContent = "";
            showStory();
            return;
          }

          message.textContent = result;

          if (step < story.length - 1) {
            step++;
            showStory();
          }
        });

        choice.classList.add("story-choice");
        stage.appendChild(choice);
      });
    }

    showStory();
    message.textContent = "Choose a path to begin your adventure.";
  }

  modal.querySelector("#playRestart").addEventListener("click", startGame);
  startGame();
}

function closePlayableGame() {
  if (typeof activeGameCleanup === "function") {
    activeGameCleanup();
  }
  activeGameCleanup = null;
}

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "×" : "☰";
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "☰";
    });
  });
}

const guessInput = document.getElementById("guessInput");
const guessMessage = document.getElementById("guessMessage");
const guessButton = document.getElementById("guessButton");
const resetButton = document.getElementById("resetGame");

let secretNumber;
let attempts;

function resetMiniGame() {
  if (!guessInput || !guessButton || !guessMessage) return;

  secretNumber = Math.floor(Math.random() * 10) + 1;
  attempts = 0;

  guessInput.value = "";
  guessInput.disabled = false;
  guessButton.disabled = false;
  guessButton.style.opacity = "1";

  guessMessage.textContent = "Ready, player? Make your first guess.";
}

function makeGuess() {
  if (!guessInput || !guessMessage || !guessButton) return;

  const guess = Number(guessInput.value);

  if (
    !guessInput.value ||
    !Number.isInteger(guess) ||
    guess < 1 ||
    guess > 10
  ) {
    guessMessage.textContent = "Enter a whole number from 1 to 10.";
    return;
  }

  attempts++;

  if (guess === secretNumber) {
    guessMessage.textContent =
      `🎉 Correct! You got it in ${attempts} ${attempts === 1 ? "try" : "tries"}.`;

    guessInput.disabled = true;
    guessButton.disabled = true;
  } else if (attempts >= 3) {
    guessMessage.textContent =
      `Game over! The number was ${secretNumber}. Try again.`;

    guessInput.disabled = true;
    guessButton.disabled = true;
  } else {
    guessMessage.textContent =
      `${guess < secretNumber ? "Go higher!" : "Go lower!"} ${3 - attempts} tries left.`;
  }

  guessInput.value = "";
}

if (guessButton && guessInput) {
  guessButton.addEventListener("click", makeGuess);

  guessInput.addEventListener("keydown", event => {
    if (event.key === "Enter") makeGuess();
  });
}

if (resetButton) {
  resetButton.addEventListener("click", resetMiniGame);
}

const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

resetMiniGame();
loadGames();
