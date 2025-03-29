// src/App.js
import React from 'react';
import Game from './components/Game';
import './App.css';

function App() {
  return (
    <div className="App">
      <Game />
    </div>
  );
}

export default App;

// src/App.css
.App {
  min-height: 100vh;
  padding: 20px 0;
  background-color: #e9f5ff;
}

// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// src/index.css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #e9f5ff;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

/* Reset some default styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

button {
  cursor: pointer;
}

// package.json
{
  "name": "yacht-dice-p2p",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "peerjs": "^1.4.7",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

// README.md
# Yacht Dice P2P Multiplayer Game

A web-based, peer-to-peer multiplayer implementation of the classic Yacht Dice game, based on the original 1938 rules.

## Features

- **Real-time multiplayer** gameplay using WebRTC for peer-to-peer connections
- No central server required for gameplay - all logic happens in the browser
- Classic Yacht Dice rules with all 12 original scoring categories
- Interactive dice with roll animations and "hold" functionality
- Responsive design that works on both desktop and mobile
- Simple lobby system with shareable game codes

## How to Play

1. **Create a new game** or join an existing one with a game code
2. **Roll the dice** up to three times per turn
3. **Hold dice** between rolls by clicking on them
4. **Choose a scoring category** after your rolls
5. **Take turns** with your opponent until all categories are filled
6. **The player with the highest total score wins!**

## Scoring Categories

- **Ones through Sixes**: Sum of the respective dice
- **Full House**: Three of one kind + two of another (sum of all dice)
- **Four of a Kind**: Sum of the four matching dice
- **Little Straight**: 1-2-3-4-5 sequence (30 points)
- **Big Straight**: 2-3-4-5-6 sequence (30 points)
- **Choice**: Sum of all dice
- **Yacht**: Five of a kind (50 points)

## Running the Game Locally

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the development server with `npm start`
4. Open `http://localhost:3000` in your browser

## Deployment

The game can be easily deployed to platforms like GitHub Pages, Vercel, or Netlify.

To build for production:

```
npm run build
```

## Technologies Used

- React for the UI components
- PeerJS for WebRTC peer-to-peer connections
- CSS for styling and animations

## License

MIT
