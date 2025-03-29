// src/utils/scoring.js
// Define the scoring categories based on the 1938 Yacht rules
export const CATEGORIES = [
  { id: 'ones', name: 'Ones', description: 'Sum of all dice showing 1' },
  { id: 'twos', name: 'Twos', description: 'Sum of all dice showing 2' },
  { id: 'threes', name: 'Threes', description: 'Sum of all dice showing 3' },
  { id: 'fours', name: 'Fours', description: 'Sum of all dice showing 4' },
  { id: 'fives', name: 'Fives', description: 'Sum of all dice showing 5' },
  { id: 'sixes', name: 'Sixes', description: 'Sum of all dice showing 6' },
  { id: 'fullHouse', name: 'Full House', description: 'Three of one kind + two of another' },
  { id: 'fourOfKind', name: 'Four of a Kind', description: 'Sum of four matching dice' },
  { id: 'littleStraight', name: 'Little Straight', description: '1-2-3-4-5 sequence (30 points)' },
  { id: 'bigStraight', name: 'Big Straight', description: '2-3-4-5-6 sequence (30 points)' },
  { id: 'choice', name: 'Choice', description: 'Sum of all dice' },
  { id: 'yacht', name: 'Yacht', description: 'Five of a kind (50 points)' }
];

// Count occurrences of each die value
const countDice = (dice) => {
  const counts = {};
  for (const die of dice) {
    counts[die] = (counts[die] || 0) + 1;
  }
  return counts;
};

// Calculate score for a given category
export const calculateScore = (dice, categoryId) => {
  const counts = countDice(dice);
  const diceSum = dice.reduce((sum, die) => sum + die, 0);
  
  switch (categoryId) {
    case 'ones':
      return (counts[1] || 0) * 1;
    case 'twos':
      return (counts[2] || 0) * 2;
    case 'threes':
      return (counts[3] || 0) * 3;
    case 'fours':
      return (counts[4] || 0) * 4;
    case 'fives':
      return (counts[5] || 0) * 5;
    case 'sixes':
      return (counts[6] || 0) * 6;
    
    case 'fullHouse': {
      const values = Object.values(counts);
      if (values.includes(3) && values.includes(2)) {
        return diceSum;
      }
      return 0;
    }
    
    case 'fourOfKind': {
      for (const [value, count] of Object.entries(counts)) {
        if (count >= 4) {
          return parseInt(value) * 4;
        }
      }
      return 0;
    }
    
    case 'littleStraight': {
      const hasStraight = [1, 2, 3, 4, 5].every(value => counts[value]);
      return hasStraight ? 30 : 0;
    }
    
    case 'bigStraight': {
      const hasStraight = [2, 3, 4, 5, 6].every(value => counts[value]);
      return hasStraight ? 30 : 0;
    }
    
    case 'choice':
      return diceSum;
    
    case 'yacht': {
      return Object.values(counts).includes(5) ? 50 : 0;
    }
    
    default:
      return 0;
  }
};

// Calculate potential score for displaying to the player
export const calculatePotentialScore = (dice, categoryId) => {
  return calculateScore(dice, categoryId);
};

// src/components/ConnectionSetup.js
import React, { useState } from 'react';
import './ConnectionSetup.css';

const ConnectionSetup = ({ createGame, joinGame, gameId }) => {
  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGame = () => {
    if (!playerName) {
      setError('Please enter your name');
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      createGame(playerName);
    } catch (err) {
      setError('Failed to create game: ' + err.message);
      setIsCreating(false);
    }
  };

  const handleJoinGame = () => {
    if (!playerName) {
      setError('Please enter your name');
      return;
    }
    
    if (!joinRoomId) {
      setError('Please enter a game code');
      return;
    }
    
    setIsJoining(true);
    setError('');
    
    try {
      joinGame(playerName, joinRoomId.toUpperCase());
    } catch (err) {
      setError('Failed to join game: ' + err.message);
      setIsJoining(false);
    }
  };

  const copyGameId = () => {
    navigator.clipboard.writeText(gameId);
    alert('Game code copied to clipboard!');
  };

  return (
    <div className="connection-setup">
      <h1>Yacht Dice</h1>
      <h2>Multiplayer Setup</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="playerName">Your Name:</label>
        <input
          type="text"
          id="playerName"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          disabled={isCreating || isJoining}
        />
      </div>
      
      <div className="buttons-container">
        <div className="create-game">
          <button 
            onClick={handleCreateGame}
            disabled={isCreating || isJoining}
          >
            {isCreating ? 'Creating...' : 'Create New Game'}
          </button>
          
          {gameId && (
            <div className="game-code">
              <p>Share this code with your friend:</p>
              <div className="code-display">
                <span>{gameId}</span>
                <button onClick={copyGameId}>Copy</button>
              </div>
              <p className="waiting-text">Waiting for opponent to join...</p>
            </div>
          )}
        </div>
        
        <div className="divider">OR</div>
        
        <div className="join-game">
          <div className="form-group">
            <label htmlFor="roomId">Game Code:</label>
            <input
              type="text"
              id="roomId"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              disabled={isCreating || isJoining}
              placeholder="Enter 6-digit code"
            />
          </div>
          
          <button 
            onClick={handleJoinGame}
            disabled={isCreating || isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </div>
      
      <div className="rules-summary">
        <h3>Game Rules:</h3>
        <ul>
          <li>Players take turns rolling five dice up to three times per turn</li>
          <li>After each turn, select a scoring category</li>
          <li>Each category can only be used once</li>
          <li>Game ends after 12 rounds (all categories filled)</li>
          <li>The player with the highest total score wins</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectionSetup;
