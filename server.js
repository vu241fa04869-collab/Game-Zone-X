
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const games = [
  {
    id: 1,
    title: "Neon Velocity",
    genre: "Racing",
    rating: "4.8",
    description: "Race through glowing city streets.",
    tag: "Speed run",
    image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80",
    playable: true
  },
  {
    id: 2,
    title: "Shadow Strike",
    genre: "Action",
    rating: "4.9",
    description: "Jump into a high-stakes mission.",
    tag: "Combat",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    playable: true
  },
  {
    id: 3,
    title: "Wild Frontier",
    genre: "Adventure",
    rating: "4.7",
    description: "Explore mysterious worlds and ruins.",
    tag: "Explore",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    playable: true
  },
  {
    id: 4,
    title: "Pixel Quest",
    genre: "Puzzle",
    rating: "4.6",
    description: "Solve clever puzzles, one level at a time.",
    tag: "Brain power",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    playable: true
  },
  {
    id: 5,
    title: "Apex Arena",
    genre: "Action",
    rating: "4.8",
    description: "Team up and test your reflexes.",
    tag: "Team play",
    image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=800&q=80",
    playable: true
  },
  {
    id: 6,
    title: "Turbo Drift",
    genre: "Racing",
    rating: "4.5",
    description: "Master every turn and drift.",
    tag: "Drift",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80",
    playable: true
  },
  {
    id: 7,
    title: "Mystic Valley",
    genre: "Adventure",
    rating: "4.9",
    description: "Discover a magical hidden valley.",
    tag: "Story mode",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80",
    playable: true
  },
  {
    id: 8,
    title: "Mind Maze",
    genre: "Puzzle",
    rating: "4.4",
    description: "Find your way through tricky mazes.",
    tag: "Think smart",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    playable: true
  }
];

app.get("/", (req, res) => {
  res.json({
    message: "GameZone X Backend is running!",
    status: "success"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    server: "running",
    database: process.env.MONGO_URI
      ? "configured"
      : "not configured yet"
  });
});

app.get("/api/games", (req, res) => {
  res.json(games);
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`GameZone X server running at http://localhost:${PORT}`);
});
