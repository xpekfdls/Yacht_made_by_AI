// Yacht Dice Game Logic
class YachtDiceGame {
  constructor() {
    // Game state
    this.dice = [1, 1, 1, 1, 1]; // Current dice values
    this.heldDice = [false, false, false, false, false]; // Which dice are held
    this.currentPlayer = 1; // Player 1 or 2
    this.rollsLeft = 3; // Rolls left in current turn
    this.scores = {
      player1: {
        ones: null,
        twos: null,
        threes: null,
        fours: null,
        fives: null,
        sixes: null,
        fullHouse: null,
        fourOfAKind: null,
        littleStraight: null,
        bigStraight: null,
        choice: null,
        yacht: null
      },
      player2: {
        ones: null,
        twos: null,
        threes: null,
        fours: null,
        fives: null,
        sixes: null,
        fullHouse: null,
        fourOfAKind: null,
        littleStraight: null,
        bigStraight: null,
        choice: null,
        yacht: null
      }
    };
    this.totals = { player1: 0, player2: 0 };
    this.round = 1; // Current round (1-12)
    this.gameOver = false;
    this.stateChangeCallbacks = [];
    this.turnUpdateCallbacks = [];

    // Local player
    this.localPlayer = 1;
  }

  // Set local player (1 or 2)
  setLocalPlayer(playerNumber) {
    this.localPlayer = playerNumber;
  }

  // Get current game state
  getGameState() {
    return {
      dice: this.dice,
      heldDice: this.heldDice,
      currentPlayer: this.currentPlayer,
      rollsLeft: this.rollsLeft,
      scores: this.scores,
      totals: this.totals,
      round: this.round,
      gameOver: this.gameOver
    };
  }

  // Set game state (used when receiving state updates from peer)
  setGameState(state) {
    this.dice = state.dice;
    this.heldDice = state.heldDice;
    this.currentPlayer = state.currentPlayer;
    this.rollsLeft = state.rollsLeft;
    this.scores = state.scores;
    this.totals = state.totals;
    this.round = state.round;
    this.gameOver = state.gameOver;
    
    // Notify state change
    this.notifyStateChange();
  }

  // Check if it's the local player's turn
  isLocalPlayerTurn() {
    return this.currentPlayer === this.localPlayer;
  }

  // Roll the dice
  rollDice() {
    // Check if it's the local player's turn and if rolls are left
    if (!this.isLocalPlayerTurn() || this.rollsLeft <= 0) {
      return false;
    }

    // Roll only the dice that aren't held
    for (let i = 0; i < this.dice.length; i++) {
      if (!this.heldDice[i]) {
        this.dice[i] = Math.floor(Math.random() * 6) + 1;
      }
    }

    // Decrement rolls left
    this.rollsLeft--;

    // Notify state change
    this.notifyStateChange();
    return true;
  }

  // Toggle held state of a die
  toggleHoldDie(index) {
    // Check if it's the local player's turn and if rolls are left
    if (!this.isLocalPlayerTurn() || this.rollsLeft === 3 || this.rollsLeft === 0) {
      return false;
    }

    this.heldDice[index] = !this.heldDice[index];
    
    // Notify state change
    this.notifyStateChange();
    return true;
  }

  // Reset held dice
  resetHeldDice() {
    this.heldDice = [false, false, false, false, false];
  }

  // Calculate the score for a specific category
  calculateScore(category) {
    const counts = this.getCounts();
    
    switch (category) {
      case 'ones':
        return this.sumOfNumber(1);
      case 'twos':
        return this.sumOfNumber(2);
      case 'threes':
        return this.sumOfNumber(3);
      case 'fours':
        return this.sumOfNumber(4);
      case 'fives':
        return this.sumOfNumber(5);
      case 'sixes':
        return this.sumOfNumber(6);
      case 'fullHouse':
        return this.isFullHouse(counts) ? this.sumOfDice() : 0;
      case 'fourOfAKind':
        return this.hasFourOfKind(counts) ? this.sumFourOfKind(counts) : 0;
      case 'littleStraight':
        return this.isLittleStraight() ? 30 : 0;
      case 'bigStraight':
        return this.isBigStraight() ? 30 : 0;
      case 'choice':
        return this.sumOfDice();
      case 'yacht':
        return this.isYacht(counts) ? 50 : 0;
      default:
        return 0;
    }
  }

  // Count occurrences of each dice value
  getCounts() {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const die of this.dice) {
      counts[die]++;
    }
    return counts;
  }

  // Sum of all dice
  sumOfDice() {
    return this.dice.reduce((sum, die) => sum + die, 0);
  }

  // Sum of specific number
  sumOfNumber(number) {
    return this.dice.filter(die => die === number).reduce((sum, die) => sum + die, 0);
  }

  // Check if the dice form a full house (3 of one kind, 2 of another)
  isFullHouse(counts) {
    const values = Object.values(counts);
    return values.includes(3) && values.includes(2);
  }

  // Check if the dice have at least four of a kind
  hasFourOfKind(counts) {
    return Object.values(counts).some(count => count >= 4);
  }

  // Sum the four matching dice in a four of a kind
  sumFourOfKind(counts) {
    for (const [value, count] of Object.entries(counts)) {
      if (count >= 4) {
        return parseInt(value) * 4;
      }
    }
    return 0;
  }

  // Check if the dice form a little straight (1-2-3-4-5)
  isLittleStraight() {
    const sorted = [...this.dice].sort((a, b) => a - b).join('');
    return sorted === '12345' || sorted === '11234' || sorted === '12344' || sorted === '12345';
  }

  // Check if the dice form a big straight (2-3-4-5-6)
  isBigStraight() {
    const sorted = [...this.dice].sort((a, b) => a - b).join('');
    return sorted === '23456' || sorted === '22345' || sorted === '23455' || sorted === '23456';
  }

  // Check if all dice show the same value (five of a kind)
  isYacht(counts) {
    return Object.values(counts).includes(5);
  }

  // Choose a category to score
  chooseCategory(category) {
    // Check if it's the local player's turn
    if (!this.isLocalPlayerTurn()) {
      return false;
    }

    const playerKey = `player${this.currentPlayer}`;
    
    // Check if category is already filled
    if (this.scores[playerKey][category] !== null) {
      return false;
    }

    // Calculate and set score
    const score = this.calculateScore(category);
    this.scores[playerKey][category] = score;

    // Update total score
    this.totals[playerKey] += score;

    // End turn
    this.endTurn();
    
    return true;
  }

  // End the current turn
  endTurn() {
    // Reset dice and rolls
    this.resetHeldDice();
    this.rollsLeft = 3;

    // Switch players
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

    // Increment round if both players have taken their turn
    if (this.currentPlayer === 1) {
      this.round++;
    }

    // Check if game is over (12 rounds completed)
    if (this.round > 12 && this.currentPlayer === 1) {
      this.gameOver = true;
      this.determineWinner();
    }

    // Notify turn update
    this.notifyTurnUpdate();
    
    // Notify state change
    this.notifyStateChange();
  }

  // Determine the winner
  determineWinner() {
    if (this.totals.player1 > this.totals.player2) {
      return 1;
    } else if (this.totals.player2 > this.totals.player1) {
      return 2;
    } else {
      return 0; // Tie
    }
  }

  // Get possible scores for all categories
  getPossibleScores() {
    const playerKey = `player${this.currentPlayer}`;
    const possibleScores = {};
    
    for (const category in this.scores[playerKey]) {
      // Only calculate for unfilled categories
      if (this.scores[playerKey][category] === null) {
        possibleScores[category] = this.calculateScore(category);
      }
    }
    
    return possibleScores;
  }

  // Reset the game
  resetGame() {
    this.dice = [1, 1, 1, 1, 1];
    this.heldDice = [false, false, false, false, false];
    this.currentPlayer = 1;
    this.rollsLeft = 3;
    this.scores = {
      player1: {
        ones: null,
        twos: null,
        threes: null,
        fours: null,
        fives: null,
        sixes: null,
        fullHouse: null,
        fourOfAKind: null,
        littleStraight: null,
        bigStraight: null,
        choice: null,
        yacht: null
      },
      player2: {
        ones: null,
        twos: null,
        threes: null,
        fours: null,
        fives: null,
        sixes: null,
        fullHouse: null,
        fourOfAKind: null,
        littleStraight: null,
        bigStraight: null,
        choice: null,
        yacht: null
      }
    };
    this.totals = { player1: 0, player2: 0 };
    this.round = 1;
    this.gameOver = false;

    // Notify state change
    this.notifyStateChange();
  }

  // Register callback for game state changes
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.stateChangeCallbacks.push(callback);
    }
  }
  
  // Register callback for turn updates
  onTurnUpdate(callback) {
    if (typeof callback === 'function') {
      this.turnUpdateCallbacks.push(callback);
    }
  }

  // Notify all registered callbacks about state changes
  notifyStateChange() {
    const state = this.getGameState();
    this.stateChangeCallbacks.forEach(callback => {
      callback(state);
    });
  }
  
  // Notify all registered callbacks about turn updates
  notifyTurnUpdate() {
    const turnInfo = {
      currentPlayer: this.currentPlayer,
      round: this.round,
      gameOver: this.gameOver
    };
    this.turnUpdateCallbacks.forEach(callback => {
      callback(turnInfo);
    });
  }
}

// Export as singleton
const yachtDiceGame = new YachtDiceGame();
