// src/components/GameControls.js
import React from 'react';
import './GameControls.css';

const GameControls = ({ rollDice, isMyTurn, rollsLeft, gameOver }) => {
  return (
    <div className="game-controls">
      <button 
        className="roll-button"
        onClick={rollDice}
        disabled={!isMyTurn || rollsLeft <= 0 || gameOver}
      >
        {rollsLeft > 0 ? `Roll (${rollsLeft} left)` : 'No rolls left'}
      </button>
      
      {!isMyTurn && !gameOver && (
        <div className="waiting-message">Waiting for opponent...</div>
      )}
      
      {isMyTurn && rollsLeft === 0 && !gameOver && (
        <div className="instruction-message">Select a category to score</div>
      )}
      
      {gameOver && (
        <button className="new-game-button" onClick={() => window.location.reload()}>
          New Game
        </button>
      )}
    </div>
  );
};

export default GameControls;

// src/utils/webrtc.js
import Peer from 'peerjs';

// Generate a random room ID
const generateGameId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Initialize peer connection
export const initPeerConnection = async (isHost, roomId = null) => {
  return new Promise((resolve, reject) => {
    // Create a new peer with random ID
    const peer = new Peer({
      config: {
        'iceServers': [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });
    
    peer.on('open', (id) => {
      console.log('My peer ID is:', id);
      
      if (isHost) {
        // Generate a new game ID
        const gameId = generateGameId();
        
        // Wait for a connection from the client
        peer.on('connection', (conn) => {
          console.log('Connected to client!');
          resolve({ connection: conn, gameId });
        });
        
        console.log('Waiting for connection with game ID:', gameId);
        resolve({ peer, gameId });
      } else {
        // Connect to the host
        if (!roomId) {
          reject(new Error('Room ID is required to join a game'));
          return;
        }
        
        // Connect to the host peer
        const conn = peer.connect(roomId);
        
        conn.on('open', () => {
          console.log('Connected to host!');
          resolve({ connection: conn, gameId: roomId });
        });
        
        conn.on('error', (err) => {
          console.error('Connection error:', err);
          reject(err);
        });
      }
    });
    
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      reject(err);
    });
  });
};

// Send game state to the other player
export const sendGameState = (connection, data) => {
  if (connection && connection.open) {
    connection.send(JSON.stringify(data));
  } else {
    console.warn('Attempted to send data but connection is not open');
  }
};
