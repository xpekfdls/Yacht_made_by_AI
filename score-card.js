// src/components/ScoreCard.js
import React from 'react';
import { CATEGORIES, calculatePotentialScore } from '../utils/scoring';
import './ScoreCard.css';

const ScoreCard = ({ 
  myScores, 
  opponentScores, 
  scoreCategory, 
  isMyTurn,
  rollsLeft, 
  currentDice 
}) => {
  // Calculate totals
  const myTotal = Object.values(myScores).reduce((sum, val) => sum + (val || 0), 0);
  const opponentTotal = Object.values(opponentScores).reduce((sum, val) => sum + (val || 0), 0);

  return (
    <div className="score-card">
      <h2>Score Card</h2>
      
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>You</th>
            <th>Opponent</th>
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((category) => {
            // Calculate potential score for this category with current dice
            const potentialScore = isMyTurn && rollsLeft < 3 
              ? calculatePotentialScore(currentDice, category.id) 
              : null;
              
            // Determine if category can be selected
            const canSelect = isMyTurn && rollsLeft < 3 && myScores[category.id] === null;
            
            return (
              <tr 
                key={category.id} 
                className={canSelect ? 'selectable' : ''}
                onClick={canSelect ? () => scoreCategory(category.id) : undefined}
              >
                <td className="category-name">
                  <div className="tooltip-container">
                    <span>{category.name}</span>
                    <div className="tooltip">{category.description}</div>
                  </div>
                </td>
                <td className={`score-cell ${canSelect ? 'potential-score' : ''}`}>
                  {myScores[category.id] !== null ? (
                    <span>{myScores[category.id]}</span>
                  ) : (
                    canSelect && <span className="potential">{potentialScore}</span>
                  )}
                </td>
                <td className="score-cell">
                  {opponentScores[category.id] !== null ? opponentScores[category.id] : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th>Total</th>
            <td>{myTotal}</td>
            <td>{opponentTotal}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ScoreCard;
