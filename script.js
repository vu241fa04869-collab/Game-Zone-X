let games = [];

const API_URL = "https://gamezone-x-backend.onrender.com/api/games";

const fallbackGames = [
  {
    id: 1,
    title: "Neon Velocity",
    genre: "Racing",
    rating: 4.8,
    description: "Race through glowing city streets.",
    tag: "Speed run",
    image: "https://placehold.co/600x400/17112b/42e8f5?text=Neon+Velocity"
  },
  {
    id: 2,
    title: "Shadow Strike",
    genre: "Action",
    rating: 4.9,
    description: "Jump into a high-stakes mission.",
    tag: "Combat",
    image: "https://placehold.co/600x400/17112b/ffffff?text=Shadow+Strike"
  },
  {
    id: 3,
    title: "Wild Frontier",
    genre: "Adventure",
    rating: 4.7,
    description: "Explore mysterious worlds and ruins.",
    tag: "Explore",
    image: "https://placehold.co/600x400/17112b/ffffff?text=Wild+Frontier"
  },
  {
    id: 4,
    title: "Pixel Quest",
    genre: "Puzzle",
    rating: 4.6,
    description: "Explore a world of puzzles and challenges.",
    tag: "Puzzle",
    image: "https://placehold.co/600x400/17112b/ffffff?text=Pixel+Quest"
  },
  {
    id: 5,
    title: "Apex Arena",
    genre: "Action",
    rating: 4.8,
    description: "Test your skills in the arena.",
    tag: "Challenge",
    image: "https://placehold.co/600x400/17112b/ffffff?text=Apex+Arena"
  },
  {
    id: 6,
    title: "Turbo Drift",
    genre: "Racing",
    rating: 4.7,
    description: "Take on exciting racing challenges.",
    tag: "Drifting",
    image: "https://placehold.co/600x400/17112b/ffffff?text=Turbo+Drift"
  },
  {
    id: 7,
    title: "Mystic Valley",
    genre: "Adventure",
    rating: 4.6,
    description: "Discover the secrets of a mysterious valley.",
    tag: "Discovery",
    image: "https://placehold.co/600x400/17112b/ffffff?text=Mystic+Valley"
  },
  {
    id: 8,
    title: "Mind Maze",
    genre: "Puzzle",
    rating: 4.9,
    description: "Challenge your mind with tricky puzzles.",
    tag: "Brain game",
    image: "https://placehold.co/600x400/17112b/ffffff?text=Mind+Maze"
  }
];

async function loadGames() {
  // Show saved games immediately, or use the fallback list.
  try {
    const savedGames = localStorage.getItem("gamezone-games");

    if (savedGames) {
      const parsedGames = JSON.parse(savedGames);

      if (Array.isArray(parsedGames) && parsedGames.length > 0) {
        games = parsedGames;
      } else {
        games = fallbackGames;
      }
    } else {
      games = fallbackGames;
    }
  } catch (error) {
    games = fallbackGames;
  }

  renderGames();

  // Try to get the latest games from the Render backend.
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const serverGames = await response.json();

    if (!Array.isArray(serverGames) || serverGames.length === 0) {
      throw new Error("No games received from server");
    }

    games = serverGames;

    try {
      localStorage.setItem("gamezone-games", JSON.stringify(games));
    } catch (storageError) {
      console.warn("Games could not be saved locally.", storageError);
    }

    renderGames();
    console.log("Games loaded successfully from Render.");
  } catch (error) {
    console.warn("Backend unavailable. Showing saved/fallback games.", error);

    showToast("Showing GameZone X games in offline mode.");

    renderGames();
  }
}
