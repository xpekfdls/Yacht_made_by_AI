// Main application
(function() {
  // Initialize UI
  uiManager.init();
  
  // Initialize WebRTC
  webRTCConnection.initSocket();
  
  // Game state
  let isCreator = false;
  let gameStarted = false;
  
  // Set up UI event handlers
  uiManager.on('createGame', () => {
    webRTCConnection.createRoom();
  });
  
  uiManager.on('joinGame', (roomCode) => {
    webRTCConnection.joinRoom(roomCode);
  });
  
  uiManager.on('rollDice', () => {
    if (yachtDiceGame.rollDice()) {
      // Send updated game state to peer
      sendGameState();
      
      // Animate dice roll
      uiManager.animateDiceRoll(
        yachtDiceGame.dice,
        yachtDiceGame.heldDice,
        yachtDiceGame.isLocalPlayerTurn(),
        yachtDiceGame.rollsLeft
      );
      
      // Update possible scores
      updatePossibleScores();
    }
  });
  
  uiManager.on('toggleHoldDie', (index) => {
    if (yachtDiceGame.toggleHoldDie(index)) {
      // Send updated game state to peer
      sendGameState();
      
      // Update UI
      uiManager.updateDice(
        yachtDiceGame.dice,
        yachtDiceGame.heldDice,
        yachtDiceGame.isLocalPlayerTurn(),
        yachtDiceGame.rollsLeft
      );
    }
  });
  
  uiManager.on('chooseCategory', (category) => {
    if (yachtDiceGame.chooseCategory(category)) {
      // Send updated game state to peer
      sendGameState();
      
      // Check if game is over
      if (yachtDiceGame.gameOver) {
        showGameOver();
      }
    }
  });
  
  uiManager.on('playAgain', () => {
    // Reset game
    yachtDiceGame.resetGame();
    
    // Send updated game state to peer
    sendGameState();
    
    // Show game screen
    uiManager.showGameScreen();
  });
  
  uiManager.on('newGame', () => {
    // Clean up current game
    cleanupGame();
    
    // Show welcome screen
    uiManager.showWelcomeScreen();
  });
  
  uiManager.on('sendChatMessage', (message) => {
    // Send chat message to peer
    webRTCConnection.sendMessage('chat', { text: message });
    
    // Add message to UI
    uiManager.addChatMessage(message, true);
  });
  
  uiManager.on('exitGame', () => {
    // Clean up current game
    cleanupGame();
    
    // Show welcome screen
    uiManager.showWelcomeScreen();
  });
  
  // Set up WebRTC connection state handler
  webRTCConnection.onConnectionStateChange((state) => {
    switch (state.type) {
      case 'room-created':
        isCreator = true;
        uiManager.showRoomCode(state.roomId);
        uiManager.showConnectionStatus('Room created successfully! Waiting for opponent...', 'success');
        break;
        
      case 'room-joined':
        uiManager.showConnectionStatus('Joined room successfully! Connecting to opponent...', 'success');
        break;
        
      case 'peer-joined':
        uiManager.showConnectionStatus('Opponent joined! Establishing connection...', 'success');
        break;
        
      case 'connected':
      case 'datachannel-open':
        if (!gameStarted) {
          startGame();
        }
        uiManager.hideConnectionLost();
        break;
        
      case 'disconnected':
      case 'datachannel-close':
        uiManager.showConnectionLost();
        // Attempt reconnection
        setTimeout(() => {
          webRTCConnection.attemptReconnect();
        }, 3000);
        break;
        
      case 'error':
        uiManager.showConnectionStatus(state.message || 'Connection error', 'error');
        break;
    }
  });
  
  // Set up WebRTC message handler
  webRTCConnection.onMessage((message) => {
    switch (message.type) {
      case 'gameState':
        // Update game state from peer
        yachtDiceGame.setGameState(message.data);
        break;
        
      case 'chat':
        // Add chat message to UI
        uiManager.addChatMessage(message.data.text, false);
        break;
    }
  });
  
  // Set up game state change handler
  yachtDiceGame.onStateChange((state) => {
    // Update UI based on game state
    updateUI(state);
  });
  
  // Start the game
  function startGame() {
    gameStarted = true;
    
    // Set local player based on whether they created the room
    yachtDiceGame.setLocalPlayer(isCreator ? 1 : 2);
    
    // Reset game state
    yachtDiceGame.resetGame();
    
    // If creator, send initial game state
    if (isCreator) {
      sendGameState();
    }
    
    // Show game screen
    uiManager.showGameScreen();
  }
  
  // Send current game state to peer
  function sendGameState() {
    webRTCConnection.sendMessage('gameState', yachtDiceGame.getGameState());
  }
  
  // Update UI based on game state
  function updateUI(state) {
    const isPlayerTurn = yachtDiceGame.isLocalPlayerTurn();
    
    // Update dice
    uiManager.updateDice(
      state.dice,
      state.heldDice,
      isPlayerTurn,
      state.rollsLeft
    );
    
    // Update scores
    const possibleScores = isPlayerTurn ? yachtDiceGame.getPossibleScores() : {};
    uiManager.updateScores(
      state.scores,
      state.totals,
      possibleScores,
      isPlayerTurn
    );
    
    // Update turn indicator
    uiManager.updateTurnIndicator(
      isPlayerTurn,
      state.round
    );
    
    // Check if game is over
    if (state.gameOver) {
      showGameOver();
    }
  }
  
  // Update possible scores
  function updatePossibleScores() {
    if (yachtDiceGame.isLocalPlayerTurn()) {
      const possibleScores = yachtDiceGame.getPossibleScores();
      uiManager.updateScores(
        yachtDiceGame.scores,
        yachtDiceGame.totals,
        possibleScores,
        true
      );
    }
  }
  
  // Show game over screen
  function showGameOver() {
    const winner = yachtDiceGame.determineWinner();
    const localPlayer = yachtDiceGame.localPlayer;
    
    // Convert winner (1, 2, or 0 for tie) to local perspective
    let winnerFromLocalPerspective;
    if (winner === 0) {
      winnerFromLocalPerspective = 0; // Tie
    } else if (winner === localPlayer) {
      winnerFromLocalPerspective = 1; // Local player won
    } else {
      winnerFromLocalPerspective = 2; // Opponent won
    }
    
    uiManager.showGameOverScreen(
      winnerFromLocalPerspective,
      yachtDiceGame.totals
    );
  }
  
  // Clean up game
  function cleanupGame() {
    // Reset game state
    yachtDiceGame.resetGame();
    
    // Clean up WebRTC connection
    webRTCConnection.cleanup();
    
    // Re-initialize socket
    webRTCConnection.initSocket();
    
    // Reset game state variables
    isCreator = false;
    gameStarted = false;
  }
})();
