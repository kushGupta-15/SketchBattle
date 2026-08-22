# SketchBattle

<div align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
</div>

<div align="center">
  <h3>Real-time multiplayer drawing and guessing game inspired by Skribbl.io</h3>
  <p>Draw, guess, and have fun with friends in real-time!</p>

  <h2><a href="https://sketch-battle-rho.vercel.app/" target="_blank">Play Now</a></h2>

  <a href="https://sketch-battle-rho.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-Play%20SketchBattle-brightgreen?style=for-the-badge&logoColor=white" alt="Live Demo" />
  </a>
</div>

---

## Features

- **Interactive Drawing Canvas** - Smooth drawing with mouse/touch support
- **Video Chat** - See and talk to your friends while playing
- **Voice Input & Feedback** - Use your voice to chat and get game updates
- **Smart Reconnection** - Reconnect within 10 seconds if you're the current drawer, or the game waits up to 30 seconds before ending if the room empties out — your score and progress are preserved either way
- **Timed Rounds & Turns** - Fast-paced gameplay with countdown timers (80-second drawing turns, 15-second word selection)
- **Rank-Based Scoring System** - The faster you guess relative to other players, the more points you earn (1st, 2nd, 3rd, and late-guess tiers)
- **Private Rooms** - Create password-protected lobbies for your friends
- **JWT Authentication** - Secure token-based user sessions (REST + Socket.IO)
- **Responsive Design** - Play on desktop, tablet, or mobile
- **Real-time Communication** - Instant updates via WebSockets
- **Customizable Drawing Tools** - Choose colors, brush sizes, and clear the canvas
- **Smart Hints** - Progressive letter reveals as the turn timer counts down

## How to Play

1. **Create or Join** a game room with a password
2. **Wait for Players** - At least 2 players needed to start
3. **Take Turns Drawing** - Choose from 3 word options when it's your turn
4. **Guess Words** - Type your guesses in the chat
5. **Earn Points** - Guess before others to earn more — first, second, and third correct guessers earn the most, with a smaller reward for later correct guesses
6. **Win the Game** - Highest score after all rounds wins

### Scoring

- **First to guess**: 120 points
- **Second to guess**: 110 points
- **Third to guess**: 100 points
- **Late guess**: 80 points
- **Drawer bonus**: 50 points (when at least one player guesses correctly)
- **Drawer penalty**: 60 points deducted (if nobody guesses; score is floored at 0)

## Tech Stack

### Frontend

- **React 18** with TypeScript
- **Socket.IO Client** for real-time communication
- **HTML5 Canvas** for drawing functionality
- **Ant Design** for UI components
- **Tailwind CSS** for styling

### Backend

- **Node.js** with Express
- **Socket.IO** for WebSocket communication (with JWT handshake authentication)
- **MongoDB** with Mongoose for room/participant persistence
- **JWT** for authentication (REST endpoints + Socket.IO connections)
- **node-cron** for a self-ping keep-alive job (useful on free-tier hosts that spin down idle instances)

> **Note:** Password hashing (bcrypt) is planned but not yet implemented — room passwords are currently stored and compared as plain text. This is a known issue being addressed.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- npm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/kushGupta-15/SketchBattle.git
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Setup environment variables**

   Create `.env` in the backend directory:

   ```env
   PORT=3000
   JWT_SECRET=your_super_secret_jwt_key_here
   MONGODB_URI=mongodb://localhost:27017/sketchbattle
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

5. **Run the application**

   **Backend** (Terminal 1):

   ```bash
   cd backend
   npm run dev
   ```

   **Frontend** (Terminal 2):

   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:5173`

## Project Structure

```
sketchbattle/
├── backend/
│   ├── controllers/     # Route controllers (auth, room create/join)
│   ├── handlers/        # Socket.IO event handlers (game events, WebRTC signaling)
│   ├── middleware/      # Socket.IO JWT auth middleware
│   ├── models/          # MongoDB models (Room, embedded participants)
│   ├── routes/          # Express routes (/api/rooms, /api/logout)
│   ├── services/        # Game logic (turn/round state machine) & in-memory game state manager
│   └── utils/           # Game config, word lists, scoring & hint helpers
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Main page components
│   │   └── utils/       # Frontend utilities
│   └── public/
└── README.md
```

## Canvas Features

- **Drawing Tools**: Pencil, eraser, color picker
- **Brush Sizes**: Adjustable stroke width (1-20px)
- **Color Palette**: 12 preset colors + custom color picker
- **Clear Canvas**: Reset drawing area (restricted server-side to the current drawer only)
- **Real-time Sync**: All players see drawings instantly

## Configuration

### Game Settings

Core game rules and scoring live in `backend/utils/gameConfig.js`:

```javascript
export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 8,
  TOTAL_ROUNDS: 3,
  TURN_TIME: 80, // seconds, per drawing turn
  POINTS: {
    FIRST_GUESS: 120,
    SECOND_GUESS: 110,
    THIRD_GUESS: 100,
    LATE_GUESS: 80,
    DRAWER: 50,
    DRAWER_PENALTY: 60,
  },
};
```

Word lists (easy/medium/hard difficulty tiers) live alongside this in the same file.

> **Note:** Word-selection time (15 seconds) is currently hardcoded in `services/gameLogic.js` rather than pulled from `GAME_CONFIG` — this is planned to be extracted into a proper config value.
>
> **Note:** `MAX_PLAYERS` is defined but not yet enforced at the join, state-management, or database layer — a room can currently accept more than 8 participants. This is a known gap being addressed.

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set build command: `npm run build`
3. Set environment variables in Vercel dashboard

### Backend (Render/Railway)

1. Connect your GitHub repo
2. Set start command: `npm start`
3. Add environment variables in dashboard
4. A built-in self-ping cron job (every 10 minutes) helps keep free-tier instances warm and avoid cold-start delays

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request