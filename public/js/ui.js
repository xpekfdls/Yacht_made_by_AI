// Yacht Dice UI Manager
class UIManager {
  constructor() {
    // Screens
    this.welcomeScreen = document.getElementById('welcome-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.connectionLostOverlay = document.getElementById('connection-lost');
    
    // Welcome screen elements
    this.createGameBtn = document.getElementById('create-game-btn');
    this.joinGameBtn = document.getElementById('join-game-btn');
    this.roomCodeInput = document.getElementById('room-code-input');
    this.connectionStatus = document.getElementById('connection-status');
    this.shareCodeContainer = document.getElementById('share-code-container');
    this.roomCodeDisplay = document.getElementById('room-code-display');
    this.copyCodeBtn = document.getElementById('copy-code-btn');
    
    // Game screen elements
    this.currentRoomCode = document.getElementById('current-room-code');
    this.turnIndicator = document.getElementById('turn-indicator');
    this.playerElements = {
      player1: document.getElementById('player1'),
      player2: document.getElementById('player2')
    };
    this.diceElements = Array.from(document.querySelectorAll('.die'));
    this.rollsLeftElement = document.getElementById('rolls-left');
    this.rollBtn = document.getElementById('roll-btn');
    this.scoreCells = {
      player1: document.querySelectorAll('.score-cell.player1'),
      player2: document.querySelectorAll('.score-cell.player2')
    };
    this.totalElements = {
      player1: document.getElementById('player1-total'),
      player2: document.getElementById('player2-total')
    };
    
    // Game over screen elements
    this.winnerText = document.getElementById('winner-text');
    this.finalScoreElements = {
      player1: document.getElementById('final-score-player1'),
      player2: document.getElementById('final-score-player2')
    };
    this.playAgainBtn = document.getElementById('play-again-btn');
    this.newGameBtn = document.getElementById('new-game-btn');
    
    // Chat elements
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendMessageBtn = document.getElementById('send-message-btn');
    
    // Event handlers
    this.eventHandlers = {};
    
    // Dice animation state
    this.rollingDice = false;
  }
  
  // Initialize UI event listeners
  init() {
    // Room creation/joining
    this.createGameBtn.addEventListener('click', () => {
      if (this.eventHandlers.createGame) {
        this.eventHandlers.createGame();
      }
    });
    
    this.joinGameBtn.addEventListener('click', () => {
      const roomCode = this.roomCodeInput.value.trim().toUpperCase();
      if (roomCode && this.eventHandlers.joinGame) {
        this.eventHandlers.joinGame(roomCode);
      } else {
        this.showConnectionStatus('Please enter a valid room code', 'error');
      }
    });
    
    this.roomCodeInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.joinGameBtn.click();
      }
    });
    
    this.copyCodeBtn.addEventListener('click', () => {
      const roomCode = this.roomCodeDisplay.textContent;
      navigator.clipboard.writeText(roomCode)
        .then(() => {
          this.copyCodeBtn.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => {
            this.copyCodeBtn.innerHTML = '<i class="fas fa-copy"></i>';
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy room code:', err);
        });
    });
    
    // Dice interaction
    this.diceElements.forEach((die, index) => {
      die.addEventListener('click', () => {
        if (!this.rollingDice && this.eventHandlers.toggleHoldDie) {
          this.eventHandlers.toggleHoldDie(index);
        }
      });
    });
    
    // Roll button
    this.rollBtn.addEventListener('click', () => {
      if (!this.rollingDice && this.eventHandlers.rollDice) {
        this.eventHandlers.rollDice();
      }
    });
    
    // Scorecard selection
    const scoreRows = document.querySelectorAll('.scorecard tbody tr');
    scoreRows.forEach(row => {
      const category = row.getAttribute('data-category');
      const player1Cell = row.querySelector('.score-cell.player1');
      
      player1Cell.addEventListener('click', () => {
        if (player1Cell.classList.contains('possible') && this.eventHandlers.chooseCategory) {
          this.eventHandlers.chooseCategory(category);
        }
      });
    });
    
    // Game over controls
    this.playAgainBtn.addEventListener('click', () => {
      if (this.eventHandlers.playAgain) {
        this.eventHandlers.playAgain();
      }
    });
    
    this.newGameBtn.addEventListener('click', () => {
      if (this.eventHandlers.newGame) {
        this.eventHandlers.newGame();
      }
    });
    
    // Chat
    this.chatInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' && this.chatInput.value.trim() !== '') {
        if (this.eventHandlers.sendChatMessage) {
          this.eventHandlers.sendChatMessage(this.chatInput.value.trim());
          this.chatInput.value = '';
        }
      }
    });
    
    this.sendMessageBtn.addEventListener('click', () => {
      if (this.chatInput.value.trim() !== '' && this.eventHandlers.sendChatMessage) {
        this.eventHandlers.sendChatMessage(this.chatInput.value.trim());
        this.chatInput.value = '';
      }
    });
    
    // Exit game button
    const exitGameBtn = document.getElementById('exit-game-btn');
    if (exitGameBtn) {
      exitGameBtn.addEventListener('click', () => {
        if (this.eventHandlers.exitGame) {
          this.eventHandlers.exitGame();
        }
      });
    }
  }
  
  // Register event handlers
  on(event, handler) {
    this.eventHandlers[event] = handler;
  }
  
  // Show welcome screen
  showWelcomeScreen() {
    this.welcomeScreen.classList.add('active');
    this.gameScreen.classList.remove('active');
    this.gameOverScreen.classList.remove('active');
    this.connectionLostOverlay.classList.add('hidden');
  }
  
  // Show game screen
  showGameScreen() {
    this.welcomeScreen.classList.remove('active');
    this.gameScreen.classList.add('active');
    this.gameOverScreen.classList.remove('active');
    this.connectionLostOverlay.classList.add('hidden');
  }
  
  // Show game over screen
  showGameOverScreen(winnerPlayerNumber, scores) {
    this.welcomeScreen.classList.remove('active');
    this.gameScreen.classList.remove('active');
    this.gameOverScreen.classList.add('active');
    
    // Update winner text
    if (winnerPlayerNumber === 0) {
      this.winnerText.textContent = "It's a tie!";
    } else if (winnerPlayerNumber === 1) {
      this.winnerText.textContent = "You win!";
    } else {
      this.winnerText.textContent = "Opponent wins!";
    }
    
    // Update final scores
    this.finalScoreElements.player1.textContent = scores.player1;
    this.finalScoreElements.player2.textContent = scores.player2;
  }
  
  // Show connection lost overlay
  showConnectionLost() {
    this.connectionLostOverlay.classList.remove('hidden');
  }
  
  // Hide connection lost overlay
  hideConnectionLost() {
    this.connectionLostOverlay.classList.add('hidden');
  }
  
  // Show connection status message
  showConnectionStatus(message, type = '') {
    this.connectionStatus.textContent = message;
    this.connectionStatus.className = 'status-message';
    
    if (type) {
      this.connectionStatus.classList.add(type);
    }
    
    // Clear status after a while if it's a success message
    if (type === 'success') {
      setTimeout(() => {
        this.connectionStatus.textContent = '';
        this.connectionStatus.className = 'status-message';
      }, 3000);
    }
  }
  
  // Show room code
  showRoomCode(roomCode) {
    this.shareCodeContainer.classList.remove('hidden');
    this.roomCodeDisplay.textContent = roomCode;
    this.currentRoomCode.textContent = roomCode;
  }
  
  // Update dice display
  updateDice(diceValues, heldDice, isPlayerTurn, rollsLeft) {
    // Update dice values and held state
    this.diceElements.forEach((die, index) => {
      // Remove previous value and held class
      die.className = 'die';
      die.removeAttribute('data-value');
      
      // Set new value and held state
      die.setAttribute('data-value', diceValues[index]);
      
      // Update die face
      const dieFace = die.querySelector('.die-face');
      dieFace.innerHTML = '';
      
      // Create dots based on die value
      for (let i = 0; i < 9; i++) {
        const dot = document.createElement('div');
        dot.className = 'die-dot';
        dieFace.appendChild(dot);
      }
      
      if (heldDice[index]) {
        die.classList.add('held');
      }
    });
    
    // Update rolls left
    this.rollsLeftElement.textContent = `Rolls left: ${rollsLeft}`;
    
    // Update roll button state
    this.rollBtn.disabled = !isPlayerTurn || rollsLeft === 0;
  }
  
  // Animate dice roll
  animateDiceRoll(diceValues, heldDice, isPlayerTurn, rollsLeft, callback) {
    this.rollingDice = true;
    
    // Play roll sound
    this.playDiceSound();
    
    // Add rolling animation to unheld dice
    this.diceElements.forEach((die, index) => {
      if (!heldDice[index]) {
        die.classList.add('rolling');
      }
    });
    
    // After animation, update dice values
    setTimeout(() => {
      this.diceElements.forEach((die, index) => {
        die.classList.remove('rolling');
      });
      
      this.updateDice(diceValues, heldDice, isPlayerTurn, rollsLeft);
      this.rollingDice = false;
      
      if (callback) callback();
    }, 500);
  }
  
  // Play dice rolling sound
  playDiceSound() {
    // Create audio element
    const audio = new Audio();
    audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCgUFBQUFBQoKCgoKCg8PDw8PDw8VFRUVFRUaGhoaGhoaHx8fHx8fHx8fJiYmJiYmKysrKysrKy4uLi4uLi4yMjIyMjI3d3d3d3d3e7u7u7u7u7u7v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYHg+gAAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAesTXWUEQBB655u1ooAAQCEEIQffAAAB4AQgoAAIIQgBAQQEBAQQEBAQEAAAAAAAAAAAQEBAQEBAQEAAAAAAAAAAAABAQEBAQEBAQEBAQAAAAAAAAAAAQEBAQEBAQEBAQEAAAAAAAAAAP/7UsQDgAeZyroCDePR5L2N3KEACAQECAQAAAAAAMAEQAYI4li+znGPklEIRgoMXB/9Q+A5QECwIHgQOAgJAgwBYGXAwUBQEDBQQACgGAN/+XWkQENBQg/+s6P/4U3QMFBgYGGDAGA0GFgIGBgACBQT+tIqwZ//7UsQDAAf9dQb2MeSI76rbvhjyoYMDAQUDCgYnCIzCNlBoQEjQIEBi0KHBiYKGAYCCQAIhIcAjIEOBBcKIQIEBBwOLAgYBBAQSAQ0FDQUJBQQADQYUCBQQMBwsIFAgiEigAACsAKgAaA0IfCUADP/7UsQCgAZZWyOsMG8I86nlfYYpuQwACgAWCBQGHA4aGEwcZCBAKIAwYEDgURAxEDDQUdCRgIJhAeBygGFAYWAhYIIiRQBBYCPg4mDjgCLAQaDioOOAYyEkAYeDh4OGhAAHCgODAZsj//tSxAWABcVlJ+wlNqCLK+T9IxlQiAQQDg4MBCIOZAxsJJQs+FngouEjoMOhI4DjoQcBhUBHAUaBRcFGAUaCB0HHQUTAwkBGgcRBxoIHQcYBR0FHwUZAjIALBQ8BigCIAI8KEwgMARAL9nU+//tSxA+ABv1tPa8cjkD3rG79MaVxGiEgYHIgIuCjQOLAQqCj4CIAgaDEQUUBRMGFQcaBRQDEgcOAxMDHgYYBh8GFwk6BCgICgoaCiQGNhI8CigEJgoqAiYKLAQyDDIKKAAmCiIORB51HDQYe//tSxBiAB11tPK8YngEEL+jVtj2pB4QCAQQEBwYHJgYmBjgGJAQwEDAAGAYSBhAGCAYSBQ8DjoMKAg2CiYKKgoiDCoMJgwuCCIEGggVBBYDDgAMCjIAKgYsCiIGDAYYBC4OKg4qhAwUCCIGP/3aK//tSxCOAB+1tLay946EEMCk9lJ3QAYEAAUDFA0eEU1NToVwQSSUkkkkkkknnnSSMeKUpSsUkE4iQVX8BJIJAmRjxipJJJC8nUTr+hlE20IYEs0TIxJJJJPPPSOeIUtWKUQIgQAIhACIEACIQAiE=';
    audio.volume = 0.5;
    audio.play().catch(e => console.warn('Could not play sound:', e));
  }
  
  // Update score display
  updateScores(scores, totals, possibleScores = {}, isPlayerTurn = false) {
    // Update player totals
    this.totalElements.player1.textContent = totals.player1;
    this.totalElements.player2.textContent = totals.player2;
    
    // Update score cells
    const scoreRows = document.querySelectorAll('.scorecard tbody tr');
    scoreRows.forEach(row => {
      const category = row.getAttribute('data-category');
      const player1Cell = row.querySelector('.score-cell.player1');
      const player2Cell = row.querySelector('.score-cell.player2');
      
      // Player 1 scores
      if (scores.player1[category] !== null) {
        player1Cell.textContent = scores.player1[category];
        player1Cell.classList.add('filled');
        
        if (scores.player1[category] === 0) {
          player1Cell.classList.add('zero');
        } else {
          player1Cell.classList.remove('zero');
        }
      } else {
        player1Cell.textContent = '';
        player1Cell.classList.remove('filled', 'zero');
      }
      
      // Player 2 scores
      if (scores.player2[category] !== null) {
        player2Cell.textContent = scores.player2[category];
        player2Cell.classList.add('filled');
        
        if (scores.player2[category] === 0) {
          player2Cell.classList.add('zero');
        } else {
          player2Cell.classList.remove('zero');
        }
      } else {
        player2Cell.textContent = '';
        player2Cell.classList.remove('filled', 'zero');
      }
      
      // Highlight possible scores for current player
      if (isPlayerTurn && category in possibleScores && scores.player1[category] === null) {
        player1Cell.classList.add('possible');
        player1Cell.textContent = possibleScores[category];
      } else {
        player1Cell.classList.remove('possible');
      }
    });
  }
  
  // Update turn indicator
  updateTurnIndicator(isPlayerTurn, currentRound) {
    // Highlight active player
    this.playerElements.player1.classList.toggle('player-active', isPlayerTurn);
    this.playerElements.player2.classList.toggle('player-active', !isPlayerTurn);
    
    // Update turn text
    if (isPlayerTurn) {
      this.turnIndicator.querySelector('.player-name').textContent = 'Your Turn';
    } else {
      this.turnIndicator.querySelector('.player-name').textContent = "Opponent's Turn";
    }
  }
  
  // Add chat message
  addChatMessage(message, isSent = true) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${isSent ? 'sent' : 'received'}`;
    messageEl.textContent = message;
    this.chatMessages.appendChild(messageEl);
    
    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
}

// Export as singleton
const uiManager = new UIManager();
