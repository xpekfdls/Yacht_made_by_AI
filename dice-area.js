// src/components/DiceArea.js
import React from 'react';
import Die from './Die';
import './DiceArea.css';

const DiceArea = ({ dice, heldDice, toggleHold, isMyTurn, rollsLeft }) => {
  return (
    <div className="dice-area">
      {dice.map((value, index) => (
        <Die 
          key={index}
          value={value}
          held={heldDice[index]}
          onClick={() => toggleHold(index)}
          disabled={!isMyTurn || rollsLeft === 3}
        />
      ))}
      {!isMyTurn && <div className="dice-overlay">Waiting for opponent...</div>}
    </div>
  );
};

export default DiceArea;

// src/components/Die.js
import React from 'react';
import './Die.css';

const Die = ({ value, held, onClick, disabled }) => {
  // Dice face patterns
  const renderDots = () => {
    switch (value) {
      case 1:
        return (
          <div className="die-face">
            <div className="dot center"></div>
          </div>
        );
      case 2:
        return (
          <div className="die-face">
            <div className="dot top-left"></div>
            <div className="dot bottom-right"></div>
          </div>
        );
      case 3:
        return (
          <div className="die-face">
            <div className="dot top-left"></div>
            <div className="dot center"></div>
            <div className="dot bottom-right"></div>
          </div>
        );
      case 4:
        return (
          <div className="die-face">
            <div className="dot top-left"></div>
            <div className="dot top-right"></div>
            <div className="dot bottom-left"></div>
            <div className="dot bottom-right"></div>
          </div>
        );
      case 5:
        return (
          <div className="die-face">
            <div className="dot top-left"></div>
            <div className="dot top-right"></div>
            <div className="dot center"></div>
            <div className="dot bottom-left"></div>
            <div className="dot bottom-right"></div>
          </div>
        );
      case 6:
        return (
          <div className="die-face">
            <div className="dot top-left"></div>
            <div className="dot top-right"></div>
            <div className="dot middle-left"></div>
            <div className="dot middle-right"></div>
            <div className="dot bottom-left"></div>
            <div className="dot bottom-right"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`die ${held ? 'held' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={!disabled ? onClick : undefined}
    >
      {renderDots()}
    </div>
  );
};

export default Die;
