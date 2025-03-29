// 게임 상태 변수
let gameState = {
  dice: [1, 1, 1, 1, 1],
  diceHolds: [false, false, false, false, false],
  rollCount: 0,
  maxRolls: 3,
  scoreCard: null,
  totalScore: 0
};

// UI 이벤트 리스너 설정
function setupUIEventListeners() {
  // 메뉴 화면 버튼
  document.getElementById('solo-mode-btn').addEventListener('click', showSoloMode);
  document.getElementById('create-room-btn').addEventListener('click', showCreateRoomScreen);
  document.getElementById('join-room-btn').addEventListener('click', showJoinRoomScreen);
  
  // 방 생성 화면 버튼
  document.getElementById('create-room-submit').addEventListener('click', handleCreateRoom);
  document.getElementById('create-room-back').addEventListener('click', showMenuScreen);
  
  // 방 참가 화면 버튼
  document.getElementById('join-room-submit').addEventListener('click', handleJoinRoom);
  document.getElementById('join-room-back').addEventListener('click', showMenuScreen);
  
  // 게임 화면 버튼
  document.getElementById('roll-dice-btn').addEventListener('click', handleRollDice);
  
  // 주사위 클릭 이벤트
  document.querySelectorAll('.dice').forEach(dice => {
    dice.addEventListener('click', function() {
      if (playerInfo.gameMode === 'solo' || playerInfo.isTurn) {
        const diceIndex = parseInt(this.dataset.index);
        toggleHold(diceIndex);
      }
    });
  });
  
  // 점수 카테고리 클릭 이벤트
  document.querySelectorAll('.category').forEach(category => {
    category.addEventListener('click', function() {
      if ((playerInfo.gameMode === 'solo' || playerInfo.isTurn) && 
          gameState.rollCount > 0 && 
          !this.classList.contains('disabled')) {
        const categoryName = this.dataset.category;
        selectScore(categoryName);
      }
    });
  });
  
  // PVP 점수판 탭 클릭 이벤트
  document.querySelectorAll('.score-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.score-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const playerKey = this.dataset.player;
      const playerIds = Object.keys(playerInfo.players);
      const playerId = playerIds[parseInt(playerKey.replace('player', '')) - 1];
      
      if (playerInfo.players[playerId]) {
        updateScoreCard(playerInfo.players[playerId].scoreCard);
      }
    });
  });
  
  // 게임 결과 화면 버튼
  document.getElementById('back-to-menu').addEventListener('click', showMenuScreen);
}

// 화면 전환 함수들
function showMenuScreen() {
  hideAllScreens();
  document.getElementById('menu-screen').classList.remove('hidden');
  
  // 게임 상태 초기화
  resetGameState();
  playerInfo = {
    playerId: null,
    playerName: '',
    roomCode: null,
    players: {},
    isTurn: false,
    gameMode: null
  };
}

function showSoloMode() {
  // 솔로 게임 시작
  playerInfo.gameMode = 'solo';
  startSoloGame();
}

function showCreateRoomScreen() {
  hideAllScreens();
  document.getElementById('create-room-screen').classList.remove('hidden');
}

function showJoinRoomScreen() {
  hideAllScreens();
  document.getElementById('join-room-screen').classList.remove('hidden');
}

function showWaitingRoom() {
  hideAllScreens();
  document.getElementById('waiting-room-screen').classList.remove('hidden');
  document.getElementById('room-code-display').textContent = playerInfo.roomCode;
}

function startGame() {
  hideAllScreens();
  document.getElementById('game-screen').classList.remove('hidden');
  
  // 게임 모드에 따라 UI 조정
  if (playerInfo.gameMode === 'pvp') {
    document.getElementById('game-mode-title').textContent = 'Yacht Dice - PVP 모드';
    document.getElementById('turn-info').classList.remove('hidden');
    document.getElementById('room-info').classList.remove('hidden');
    document.getElementById('game-room-code').textContent = playerInfo.roomCode;
    document.getElementById('pvp-score-tabs').classList.remove('hidden');
    
    updatePlayersList();
    updateTurnDisplay();
  } else {
    document.getElementById('game-mode-title').textContent = 'Yacht Dice - Solo 모드';
  }
  
  // 게임 상태 초기화
  resetGameState();
  updateDice(gameState.dice);
  updateRollsLeft(gameState.maxRolls);
  
  // 점수판 초기화
  gameState.scoreCard = createEmptyScoreCard();
  updateScoreCard(gameState.scoreCard);
}

function hideAllScreens() {
  const screens = [
    'menu-screen', 
    'create-room-screen', 
    'join-room-screen', 
    'waiting-room-screen', 
    'game-screen', 
    'game-result-screen'
  ];
  
  screens.forEach(screen => {
    document.getElementById(screen).classList.add('hidden');
  });
}

// 이벤트 핸들러 함수들
function handleCreateRoom() {
  const playerName = document.getElementById('create-name').value.trim();
  
  if (playerName) {
    createRoom(playerName);
  } else {
    showNotification('닉네임을 입력해주세요!');
  }
}

function handleJoinRoom() {
  const roomCode = document.getElementById('join-code').value.trim().toUpperCase();
  const playerName = document.getElementById('join-name').value.trim();
  
  if (!roomCode) {
    showNotification('방 코드를 입력해주세요!');
    return;
  }
  
  if (!playerName) {
    showNotification('닉네임을 입력해주세요!');
    return;
  }
  
  joinRoom(roomCode, playerName);
}

function handleRollDice() {
  if (gameState.rollCount < gameState.maxRolls) {
    rollDice();
  }
}

// 솔로 모드 게임 로직
function handleSoloRollDice() {
  // 주사위 굴리기
  for (let i = 0; i < 5; i++) {
    if (!gameState.diceHolds[i]) {
      gameState.dice[i] = Math.floor(Math.random() * 6) + 1;
    }
  }
  
  gameState.rollCount++;
  updateDice(gameState.dice);
  updateRollsLeft(gameState.maxRolls - gameState.rollCount);
  
  // 선택 가능한 카테고리 표시
  updateSelectableCategories();
}

function handleSoloSelectScore(category) {
  // 점수 계산
  const score = calculateScore(gameState.dice, category);
  
  // 점수판 업데이트
  gameState.scoreCard[category] = score;
  updateScoreCard(gameState.scoreCard);
  
  // 게임 종료 체크
  const isGameOver = checkGameOver();
  
  if (isGameOver) {
    // 게임 종료
    showGameResults({
      winner: 'solo',
      score: gameState.totalScore
    });
  } else {
    // 새 턴 시작
    resetDice();
    gameState.rollCount = 0;
    updateRollsLeft(gameState.maxRolls);
  }
}

// UI 업데이트 함수들
function updateDice(diceValues) {
  gameState.dice = diceValues;
  
  const diceElements = document.querySelectorAll('.dice');
  for (let i = 0; i < diceElements.length; i++) {
    const diceEl = diceElements[i];
    const diceFace = diceEl.querySelector('.dice-face');
    diceFace.textContent = diceValues[i];
  }
  
  if (playerInfo.gameMode === 'solo' || playerInfo.isTurn) {
    updateSelectableCategories();
  }
}

function toggleDiceHold(diceIndex) {
  if (gameState.rollCount === 0) return; // 첫 번째 굴림 전에는 고정 불가
  
  gameState.diceHolds[diceIndex] = !gameState.diceHolds[diceIndex];
  const diceElement = document.querySelector(`.dice[data-index="${diceIndex}"]`);
  
  if (gameState.diceHolds[diceIndex]) {
    diceElement.classList.add('held');
  } else {
    diceElement.classList.remove('held');
  }
}

function updateRollsLeft(count) {
  document.getElementById('rolls-left').textContent = count;
  
  // 굴림 횟수에 따라 굴리기 버튼 활성화/비활성화
  const rollButton = document.getElementById('roll-dice-btn');
  if (count === 0 || (playerInfo.gameMode === 'pvp' && !playerInfo.isTurn)) {
    rollButton.disabled = true;
    rollButton.classList.add('disabled');
  } else {
    rollButton.disabled = false;
    rollButton.classList.remove('disabled');
  }
}

function resetDice() {
  gameState.dice = [1, 1, 1, 1, 1];
  gameState.diceHolds = [false, false, false, false, false];
  
  // 주사위 UI 초기화
  const diceElements = document.querySelectorAll('.dice');
  diceElements.forEach((dice, index) => {
    dice.classList.remove('held');
    dice.querySelector('.dice-face').textContent = '1';
  });
}

function updatePlayersList() {
  const playersList = document.getElementById('players-list');
  playersList.innerHTML = '';
  
  Object.keys(playerInfo.players).forEach((playerId, index) => {
    const player = playerInfo.players[playerId];
    const li = document.createElement('li');
    li.textContent = `플레이어 ${index + 1}: ${player.name}`;
    
    if (playerId === playerInfo.playerId) {
      li.textContent += ' (나)';
    }
    
    playersList.appendChild(li);
  });
}

function updateTurnDisplay() {
  const turnInfo = document.getElementById('turn-info');
  const currentPlayer = document.getElementById('current-player');
  
  if (playerInfo.gameMode === 'pvp') {
    turnInfo.classList.remove('hidden');
    
    // 현재 턴 플레이어 이름 표시
    const playerIds = Object.keys(playerInfo.players);
    for (const pid of playerIds) {
      if (pid === playerInfo.currentTurn) {
        const name = playerInfo.players[pid].name;
        currentPlayer.textContent = name + (pid === playerInfo.playerId ? ' (나)' : '');
        break;
      }
    }
    
    // 내 턴일 때와 상대 턴일 때 UI 구분
    const gameScreen = document.getElementById('game-screen');
    if (playerInfo.isTurn) {
      gameScreen.classList.add('my-turn');
      gameScreen.classList.remove('opponent-turn');
    } else {
      gameScreen.classList.remove('my-turn');
      gameScreen.classList.add('opponent-turn');
    }
  } else {
    turnInfo.classList.add('hidden');
  }
}

function updateScoreCard(scoreCard) {
  gameState.scoreCard = scoreCard;
  
  // 각 카테고리 점수 업데이트
  for (const category in scoreCard) {
    const cell = document.querySelector(`.category[data-category="${category}"] .score-cell`);
    if (cell) {
      if (scoreCard[category] !== null) {
        cell.textContent = scoreCard[category];
        cell.parentElement.classList.add('selected');
        cell.parentElement.classList.remove('selectable');
      } else {
        cell.textContent = '-';
        cell.parentElement.classList.remove('selected');
      }
    }
  }
  
  // 상단 섹션 합계 계산
  const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  let upperTotal = 0;
  for (const category of upperCategories) {
    if (scoreCard[category] !== null) {
      upperTotal += scoreCard[category];
    }
  }
  document.getElementById('upper-score').textContent = upperTotal;
  
  // 보너스 계산
  const bonus = upperTotal >= 63 ? 35 : 0;
  document.getElementById('bonus-score').textContent = bonus;
  
  // 총점 계산
  let total = upperTotal + bonus;
  const lowerCategories = ['choice', 'fourOfKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yacht'];
  for (const category of lowerCategories) {
    if (scoreCard[category] !== null) {
      total += scoreCard[category];
    }
  }
  document.getElementById('total-score').textContent = total;
  gameState.totalScore = total;
  
  // 선택 가능한 카테고리 표시
  if (playerInfo.gameMode === 'solo' || playerInfo.isTurn) {
    updateSelectableCategories();
  }
}

function updateSelectableCategories() {
  if (gameState.rollCount === 0) {
    // 주사위를 굴리지 않았을 때는 선택 불가
    document.querySelectorAll('.category').forEach(category => {
      category.classList.remove('selectable');
    });
    return;
  }
  
  document.querySelectorAll('.category').forEach(category => {
    const categoryName = category.dataset.category;
    
    if (gameState.scoreCard[categoryName] === null) {
      // 아직 선택하지 않은 카테고리만 선택 가능
      category.classList.add('selectable');
      
      // 현재 주사위로 얻을 수 있는 점수 미리보기
      const score = calculateScore(gameState.dice, categoryName);
      const scoreCell = category.querySelector('.score-cell');
      scoreCell.textContent = score;
    } else {
      category.classList.remove('selectable');
    }
  });
}

function showGameResults(data) {
  hideAllScreens();
  document.getElementById('game-result-screen').classList.remove('hidden');
  
  const winnerDisplay = document.getElementById('winner-display');
  const finalScores = document.getElementById('final-scores');
  
  if (playerInfo.gameMode === 'solo') {
    winnerDisplay.textContent = `게임 종료! 최종 점수: ${data.score}점`;
    finalScores.textContent = '';
  } else {
    if (data.reason === 'opponent-left') {
      winnerDisplay.textContent = '상대방이 게임을 떠났습니다. 승리!';
      finalScores.textContent = '';
    } else {
      const winnerId = data.winner;
      const winnerName = playerInfo.players[winnerId].name;
      
      winnerDisplay.textContent = `승자: ${winnerName} ${winnerId === playerInfo.playerId ? '(나)' : ''}`;
      
      // 최종 점수 표시
      finalScores.innerHTML = '<h3>최종 점수</h3>';
      
      for (const playerId in data.finalScores) {
        const playerName = playerInfo.players[playerId].name;
        const score = data.finalScores[playerId];
        
        const scoreText = document.createElement('p');
        scoreText.textContent = `${playerName} ${playerId === playerInfo.playerId ? '(나)' : ''}: ${score}점`;
        finalScores.appendChild(scoreText);
      }
    }
  }
}

function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.remove('hidden');
  
  // 3초 후 자동으로 사라짐
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
}

// 게임 로직 함수들
function createEmptyScoreCard() {
  return {
    // 상단 섹션 (숫자 카테고리)
    ones: null,
    twos: null,
    threes: null,
    fours: null,
    fives: null,
    sixes: null,
    // 하단 섹션 (조합 카테고리)
    choice: null,
    fourOfKind: null,
    fullHouse: null,
    smallStraight: null,
    largeStraight: null,
    yacht: null
  };
}

function resetGameState() {
  gameState = {
    dice: [1, 1, 1, 1, 1],
    diceHolds: [false, false, false, false, false],
    rollCount: 0,
    maxRolls: 3,
    scoreCard: null,
    totalScore: 0
  };
}

function checkGameOver() {
  // 모든 카테고리에 점수가 입력되었는지 확인
  for (const category in gameState.scoreCard) {
    if (gameState.scoreCard[category] === null) {
      return false;
    }
  }
  return true;
}

// 점수 계산 로직
function calculateScore(dice, category) {
  // 주사위 숫자별 개수 카운트
  const counts = {};
  for (const value of dice) {
    counts[value] = (counts[value] || 0) + 1;
  }

  switch (category) {
    // 상단 섹션 (숫자 카테고리)
    case 'ones':
      return sumDiceWithValue(dice, 1);
    case 'twos':
      return sumDiceWithValue(dice, 2);
    case 'threes':
      return sumDiceWithValue(dice, 3);
    case 'fours':
      return sumDiceWithValue(dice, 4);
    case 'fives':
      return sumDiceWithValue(dice, 5);
    case 'sixes':
      return sumDiceWithValue(dice, 6);
    
    // 하단 섹션 (조합 카테고리)
    case 'choice':
      return dice.reduce((sum, value) => sum + value, 0);
    
    case 'fourOfKind':
      for (const value in counts) {
        if (counts[value] >= 4) {
          return dice.reduce((sum, val) => sum + val, 0);
        }
      }
      return 0;
    
    case 'fullHouse':
      let hasThree = false;
      let hasTwo = false;
      
      for (const value in counts) {
        if (counts[value] === 3) hasThree = true;
        if (counts[value] === 2) hasTwo = true;
      }
      
      if (hasThree && hasTwo) {
        return dice.reduce((sum, value) => sum + value, 0);
      }
      return 0;
    
    case 'smallStraight':
      // 작은 스트레이트 (4개 연속 숫자) 확인
      const uniqueValues = [...new Set(dice)].sort((a, b) => a - b);
      
      if (uniqueValues.length >= 4) {
        let consecutive = 1;
        let maxConsecutive = 1;
        
        for (let i = 1; i < uniqueValues.length; i++) {
          if (uniqueValues[i] === uniqueValues[i-1] + 1) {
            consecutive++;
            maxConsecutive = Math.max(maxConsecutive, consecutive);
          } else {
            consecutive = 1;
          }
        }
        
        if (maxConsecutive >= 4) {
          return 15; // 작은 스트레이트 점수
        }
      }
      return 0;
    
    case 'largeStraight':
      // 큰 스트레이트 (5개 연속 숫자) 확인
      const sortedValues = [...dice].sort((a, b) => a - b);
      
      if (
        (sortedValues[0] === 1 && sortedValues[1] === 2 && sortedValues[2] === 3 && 
         sortedValues[3] === 4 && sortedValues[4] === 5) ||
        (sortedValues[0] === 2 && sortedValues[1] === 3 && sortedValues[2] === 4 && 
         sortedValues[3] === 5 && sortedValues[4] === 6)
      ) {
        return 30; // 큰 스트레이트 점수
      }
      return 0;
    
    case 'yacht':
      // 야트 (5개 같은 숫자) 확인
      for (const value in counts) {
        if (counts[value] === 5) {
          return 50; // 야트 점수
        }
      }
      return 0;
    
    default:
      return 0;
  }
}

// 특정 숫자의 주사위 합계 계산
function sumDiceWithValue(dice, targetValue) {
  return dice.reduce((sum, value) => {
    return value === targetValue ? sum + value : sum;
  }, 0);
}