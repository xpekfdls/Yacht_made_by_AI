// src/components/Game.js
import React, { useState, useEffect, useCallback } from 'react';
import ScoreCard from './ScoreCard';
import DiceArea from './DiceArea';
import ConnectionSetup from './ConnectionSetup';
import GameControls from './GameControls';
import { initPeerConnection, sendGameState } from '../utils/webrtc';
import { calculateScore, CATEGORIES } from '../utils/scoring';
import './Game.css';

const Game = () => {
  // Game state
  const [isHost, setIsHost] = useState(false);
  const [gameId, setGameId] = useState('');
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  
  // Game play state
  const [dice, setDice] = useState([1, 2, 3, 4, 5]);
  const [heldDice, setHeldDice] = useState([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(3);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  
  // Scoring state
  const [myScores, setMyScores] = useState(
    Object.fromEntries(CATEGORIES.map(cat => [cat.id, null]))
  );
  const [opponentScores, setOpponentScores] = useState(
    Object.fromEntries(CATEGORIES.map(cat => [cat.id, null]))
  );
  const [myTotal, setMyTotal] = useState(0);
  const [opponentTotal, setOpponentTotal] = useState(0);

  // Initialize a new game
  const startNewGame = useCallback((isGameHost, conn = null) => {
    setIsHost(isGameHost);
    setIsMyTurn(isGameHost); // Host goes first
    setConnection(conn);
    setIsConnected(!!conn);
    setRollsLeft(3);
    setDice([1, 2, 3, 4, 5]);
    setHeldDice([false, false, false, false, false]);
    setRound(1);
    setGameOver(false);
    setMyScores(Object.fromEntries(CATEGORIES.map(cat => [cat.id, null])));
    setOpponentScores(Object.fromEntries(CATEGORIES.map(cat => [cat.id, null])));
    setMyTotal(0);
    setOpponentTotal(0);
  }, []);

  // Function to create a new game room
  const createGame = useCallback(async (name) => {
    setPlayerName(name);
    const { connection, gameId } = await initPeerConnection(true);
    setGameId(gameId);
    setConnection(connection);
    
    // Set up event listeners for the connection
    connection.on('data', (data) => {
      handleGameData(JSON.parse(data));
    });
    
    connection.on('open', () => {
      setIsConnected(true);
      startNewGame(true, connection);
    });
    
    connection.on('close', () => {
      setIsConnected(false);
      // Handle disconnection
    });
    
    connection.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }, [startNewGame]);

  // Function to join an existing game
  const joinGame = useCallback(async (name, roomId) => {
    setPlayerName(name);
    setGameId(roomId);
    const { connection } = await initPeerConnection(false, roomId);
    setConnection(connection);
    
    // Set up event listeners for the connection
    connection.on('data', (data) => {
      handleGameData(JSON.parse(data));
    });
    
    connection.on('open', () => {
      setIsConnected(true);
      startNewGame(false, connection);
      // Send your name to the host
      sendGameState(connection, { type: 'PLAYER_JOINED', name });
    });
    
    connection.on('close', () => {
      setIsConnected(false);
      // Handle disconnection
    });
    
    connection.on('error', (err) => {
      console.error('Connection error:', err);
    });
  }, [startNewGame]);

  // Handle incoming game data
  const handleGameData = useCallback((data) => {
    switch (data.type) {
      case 'PLAYER_JOINED':
        setOpponentName(data.name);
        // Send your name back if you're the host
        if (isHost) {
          sendGameState(connection, { type: 'HOST_INFO', name: playerName });
        }
        break;
      
      case 'HOST_INFO':
        setOpponentName(data.name);
        break;
      
      case 'GAME_STATE':
        // Update the dice and game state
        setDice(data.dice);
        setHeldDice(data.heldDice);
        setRollsLeft(data.rollsLeft);
        setIsMyTurn(!data.isMyTurn); // Toggle turn
        setRound(data.round);
        break;
      
      case 'SCORE_UPDATE':
        setOpponentScores(data.scores);
        setOpponentTotal(data.total);
        setIsMyTurn(true); // It's now my turn after opponent scores
        setRollsLeft(3); // Reset rolls for my turn
        setDice([1, 2, 3, 4, 5]);
        setHeldDice([false, false, false, false, false]);
        
        // Check if game is over (all categories filled)
        const allFilled = Object.values(data.scores).every(score => score !== null);
        if (allFilled) {
          const myAllFilled = Object.values(myScores).every(score => score !== null);
          if (myAllFilled) {
            setGameOver(true);
          }
        }
        break;
      
      default:
        console.warn('Unknown message type:', data.type);
    }
  }, [connection, isHost, playerName, myScores]);

  // Roll the dice
  const rollDice = useCallback(() => {
    if (!isMyTurn || rollsLeft <= 0) return;
    
    const newDice = [...dice];
    for (let i = 0; i < 5; i++) {
      if (!heldDice[i]) {
        newDice[i] = Math.floor(Math.random() * 6) + 1;
      }
    }
    
    setDice(newDice);
    setRollsLeft(rollsLeft - 1);
    
    // Send updated game state to opponent
    if (connection && isConnected) {
      sendGameState(connection, {
        type: 'GAME_STATE',
        dice: newDice,
        heldDice,
        rollsLeft: rollsLeft - 1,
        isMyTurn: true,
        round
      });
    }
  }, [isMyTurn, rollsLeft, dice, heldDice, connection, isConnected, round]);

  // Toggle held state of a die
  const toggleHold = useCallback((index) => {
    if (!isMyTurn || rollsLeft === 3) return; // Can't hold before first roll
    
    const newHeldDice = [...heldDice];
    newHeldDice[index] = !newHeldDice[index];
    setHeldDice(newHeldDice);
    
    // Send updated game state to opponent
    if (connection && isConnected) {
      sendGameState(connection, {
        type: 'GAME_STATE',
        dice,
        heldDice: newHeldDice,
        rollsLeft,
        isMyTurn: true,
        round
      });
    }
  }, [isMyTurn, rollsLeft, heldDice, dice, connection, isConnected, round]);

  // Score the current dice in a category
  const scoreCategory = useCallback((categoryId) => {
    if (!isMyTurn || myScores[categoryId] !== null) return;
    
    // Calculate score for this category
    const score = calculateScore(dice, categoryId);
    
    // Update scores
    const newScores = { ...myScores, [categoryId]: score };
    setMyScores(newScores);
    
    // Update total
    const newTotal = Object.values(newScores).reduce((sum, val) => sum + (val || 0), 0);
    setMyTotal(newTotal);
    
    // Send score update to opponent
    if (connection && isConnected) {
      sendGameState(connection, {
        type: 'SCORE_UPDATE',
        scores: newScores,
        total: newTotal
      });
    }
    
    // Reset for next turn
    setIsMyTurn(false);
    setRollsLeft(3);
    setDice([1, 2, 3, 4, 5]);
    setHeldDice([false, false, false, false, false]);
    
    // Check if game is over
    const allFilled = Object.values(newScores).every(score => score !== null);
    if (allFilled) {
      const oppAllFilled = Object.values(opponentScores).every(score => score !== null);
      if (oppAllFilled) {
        setGameOver(true);
      } else {
        setRound(round + 1);
      }
    } else {
      setRound(round);
    }
  }, [isMyTurn, myScores, dice, connection, isConnected, opponentScores, round]);

  // Determine winner when game is over
  const getWinner = useCallback(() => {
    if (!gameOver) return null;
    
    if (myTotal > opponentTotal) {
      return 'You win!';
    } else if (myTotal < opponentTotal) {
      return `${opponentName} wins!`;
    } else {
      return "It's a tie!";
    }
  }, [gameOver, myTotal, opponentTotal, opponentName]);

  return (
    <div className="game-container">
      {!isConnected ? (
        <ConnectionSetup 
          createGame={createGame}
          joinGame={joinGame}
          gameId={gameId}
        />
      ) : (
        <>
          <div className="game-header">
            <h1>Yacht Dice</h1>
            <div className="player-info">
              <div className={`player ${isMyTurn ? 'active' : ''}`}>
                <span className="player-name">{playerName} (You)</span>
                <span className="player-score">Score: {myTotal}</span>
              </div>
              <div className={`player ${!isMyTurn ? 'active' : ''}`}>
                <span className="player-name">{opponentName}</span>
                <span className="player-score">Score: {opponentTotal}</span>
              </div>
            </div>
            <div className="game-status">
              {gameOver ? (
                <div className="game-over">
                  <h2>Game Over!</h2>
                  <p>{getWinner()}</p>
                </div>
              ) : (
                <div className="turn-info">
                  <p>Round: {round}/12</p>
                  <p>{isMyTurn ? 'Your turn' : `${opponentName}'s turn`}</p>
                  {isMyTurn && <p>Rolls left: {rollsLeft}</p>}
                </div>
              )}
            </div>
          </div>
          
          <div className="game-play-area">
            <DiceArea 
              dice={dice}
              heldDice={heldDice}
              toggleHold={toggleHold}
              isMyTurn={isMyTurn}
              rollsLeft={rollsLeft}
            />
            
            <GameControls 
              rollDice={rollDice}
              isMyTurn={isMyTurn}
              rollsLeft={rollsLeft}
              gameOver={gameOver}
            />
            
            <ScoreCard 
              myScores={myScores}
              opponentScores={opponentScores}
              scoreCategory={scoreCategory}
              isMyTurn={isMyTurn}
              rollsLeft={rollsLeft}
              currentDice={dice}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Game;
