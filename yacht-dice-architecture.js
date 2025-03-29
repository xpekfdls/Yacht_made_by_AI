// PROJECT STRUCTURE
// ----------------
// server.js - Signaling server (Node.js + Express)
// public/
//   index.html - Main game page
//   styles.css - Game styling
//   js/
//     app.js - Main application logic
//     game.js - Yacht dice game logic
//     webrtc.js - WebRTC connection handling
//     ui.js - UI rendering and interactions

// ARCHITECTURE OVERVIEW
// --------------------
// 1. Signaling Server (server.js):
//    - Handles initial WebRTC signaling (offers, answers, ICE candidates)
//    - Creates and manages room codes
//    - No game logic on server

// 2. WebRTC Connection (webrtc.js):
//    - Establishes peer connections
//    - Creates and manages data channels
//    - Handles reconnection logic
//    - Sends/receives game state updates

// 3. Game Logic (game.js):
//    - Implements Yacht dice rules (1938 version)
//    - Manages dice rolls and score calculations
//    - Tracks game state (turns, scores, etc.)
//    - No server-side game logic

// 4. UI (ui.js):
//    - Renders game elements (dice, scorecard)
//    - Handles user interactions
//    - Provides animations and visual feedback
//    - Responsive design for desktop and mobile

// 5. Main App (app.js):
//    - Initializes components
//    - Coordinates between WebRTC and game logic
//    - Manages game flow
