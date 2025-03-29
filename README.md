# 🎲 Yacht Dice P2P Multiplayer

A peer-to-peer multiplayer implementation of the classic Yacht dice game (1938 rules) using WebRTC for direct browser-to-browser communication.

## Game Rules

Yacht Dice is played with five 6-sided dice over 12 rounds:

- Each turn allows up to 3 rolls
- After each roll, you may hold any dice
- After your rolls, choose a scoring category
- Each category can only be used once per game
- After 12 rounds, the player with the highest total wins

### Scoring Categories

- **Ones–Sixes**: Sum of that number
- **Full House**: Three of one number and two of another (sum of all dice)
- **Four of a Kind**: Sum of the four matching dice
- **Little Straight** (1-2-3-4-5): 30 pts
- **Big Straight** (2-3-4-5-6): 30 pts
- **Choice** (any dice): Sum of all dice
- **Yacht** (five of a kind): 50 pts

## Technical Architecture

This application uses a WebRTC peer-to-peer architecture for direct browser-to-browser communication:

1. **Signaling Server**: A lightweight Node.js/Express server that only facilitates the initial WebRTC connection.
2. **WebRTC Data Channels**: Once connected, all game data is transmitted directly between players using WebRTC Data Channels.
3. **Peer-to-Peer Architecture**: No game logic runs on the server - everything happens in the browser.
4. **Responsive Design**: Works well on both desktop and mobile devices.

## Features

- **Fully P2P Gameplay**: Direct communication between browsers with no game server.
- **Animated Dice**: Visual dice with roll animations and click-to-hold functionality.
- **Real-time Sync**: Game state is instantly synchronized between players.
- **In-game Chat**: Chat with your opponent while playing.
- **Scorecard**: Interactive scorecard with tooltips explaining each scoring rule.
- **Responsive Design**: Play on desktop or mobile.
- **Reconnection Logic**: Handles disconnections and reconnections gracefully.

## How to Play

1. **Create a Game**: Click "Create New Game" button to generate a room code.
2. **Share the Code**: Send the displayed room code to your friend.
3. **Join a Game**: Enter a room code and click "Join Game".
4. **Take Turns**: Players alternate turns, with 3 rolls per turn.
5. **Score Points**: Choose a scoring category after each turn.
6. **Win the Game**: The player with the highest score after 12 rounds wins.

## Development

This project is built with:

- **Frontend**: HTML, CSS, JavaScript
- **Server**: Node.js, Express
- **Communication**: Socket.io (for signaling), WebRTC (for gameplay)

To run locally:
1. Clone the repository
2. Run `npm install`
3. Run `npm start`
4. Open http://localhost:3000 in your browser

## Deployment

This project is ready for deployment on Glitch. Simply:
1. Create a new Glitch project
2. Import the files
3. The project will automatically deploy

## License

MIT License
