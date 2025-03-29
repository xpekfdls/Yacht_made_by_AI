// Socket.io 클라이언트 설정
const socket = io();

// 플레이어 정보
let playerInfo = {
  playerId: null,
  playerName: '',
  roomCode: null,
  players: {},
  isTurn: false,
  gameMode: null // 'solo' 또는 'pvp'
};

// 소켓 이벤트 리스너 등록
function setupSocketListeners() {
  // 솔로 게임 시작
  socket.on('solo-started', () => {
    console.log('Solo game started');
    playerInfo.gameMode = 'solo';
    startGame();
  });

  // 방 생성 완료
  socket.on('room-created', (data) => {
    console.log('Room created:', data);
    playerInfo.playerId = data.playerId;
    playerInfo.roomCode = data.roomCode;
    showWaitingRoom();
  });

  // 방 참가 완료
  socket.on('room-joined', (data) => {
    console.log('Room joined:', data);
    playerInfo.playerId = data.playerId;
    playerInfo.roomCode = data.roomCode;
    playerInfo.players = data.players;
    showWaitingRoom();
    updatePlayersList();
  });

  // 방 참가 오류
  socket.on('join-error', (data) => {
    showNotification(data.error);
  });

  // 다른 플레이어 참가
  socket.on('player-joined', (data) => {
    console.log('Player joined:', data);
    playerInfo.players = data.players;
    updatePlayersList();
    
    // 게임 시작 가능한 상태라면 대기 메시지 업데이트
    if (Object.keys(playerInfo.players).length >= 2) {
      document.getElementById('waiting-message').textContent = '모든 플레이어가 모였습니다. 곧 게임이 시작됩니다...';
    }
  });

  // 게임 시작
  socket.on('game-started', (data) => {
    console.log('Game started:', data);
    playerInfo.players = data.players;
    playerInfo.gameMode = 'pvp';
    playerInfo.isTurn = data.currentTurn === playerInfo.playerId;
    startGame();
  });

  // 주사위 굴림 결과
  socket.on('dice-rolled', (data) => {
    console.log('Dice rolled:', data);
    updateDice(data.dice);
    
    // 자신의 턴인 경우에만 남은 굴림 횟수 업데이트
    if (data.playerId === playerInfo.playerId) {
      updateRollsLeft(3 - data.rollCount);
    }
  });

  // 주사위 고정 토글
  socket.on('hold-toggled', (data) => {
    console.log('Hold toggled:', data);
    toggleDiceHold(data.diceIndex);
  });

  // 점수 선택
  socket.on('score-selected', (data) => {
    console.log('Score selected:', data);
    
    // 플레이어가 선택한 점수 업데이트
    const player = playerInfo.players[data.playerId];
    if (player) {
      player.scoreCard = data.scoreCard;
      
      // 현재 보고 있는 점수판에 해당하는 플레이어라면 화면 업데이트
      if (data.playerId === playerInfo.playerId || 
          (document.querySelector('.score-tab.active') && 
           document.querySelector('.score-tab.active').dataset.player === getPlayerKeyById(data.playerId))) {
        updateScoreCard(data.scoreCard);
      }
    }
    
    // 턴 변경
    playerInfo.isTurn = data.nextTurn === playerInfo.playerId;
    updateTurnDisplay();
    
    // 자신의 턴이면 주사위 초기화
    if (playerInfo.isTurn) {
      resetDice();
      updateRollsLeft(3);
    }
  });

  // 게임 종료
  socket.on('game-over', (data) => {
    console.log('Game over:', data);
    showGameResults(data);
  });

  // 플레이어 퇴장
  socket.on('player-left', (data) => {
    console.log('Player left:', data);
    
    if (data.gameOver) {
      // 게임 중에 상대방이 나간 경우
      showGameResults({ 
        winner: playerInfo.playerId,
        reason: 'opponent-left' 
      });
    } else {
      // 대기실에서 나간 경우
      playerInfo.players = data.players;
      updatePlayersList();
      document.getElementById('waiting-message').textContent = '상대방이 들어오기를 기다리는 중...';
    }
  });
}

// 플레이어ID로 플레이어 키 가져오기 ('player1', 'player2' 등)
function getPlayerKeyById(playerId) {
  const playerIds = Object.keys(playerInfo.players);
  const idx = playerIds.indexOf(playerId);
  return `player${idx + 1}`;
}

// SocketIO 이벤트 송신 함수들
function startSoloGame() {
  socket.emit('start-solo');
}

function createRoom(playerName) {
  playerInfo.playerName = playerName;
  socket.emit('create-room', playerName);
}

function joinRoom(roomCode, playerName) {
  playerInfo.playerName = playerName;
  socket.emit('join-room', { roomCode, playerName });
}

function rollDice() {
  if (playerInfo.gameMode === 'solo') {
    // 솔로 모드는 클라이언트에서 처리
    handleSoloRollDice();
  } else {
    // PVP 모드는 서버에 요청
    const rollCount = 3 - parseInt(document.getElementById('rolls-left').textContent);
    socket.emit('roll-dice', { 
      roomCode: playerInfo.roomCode, 
      rollCount: rollCount
    });
  }
}

function toggleHold(diceIndex) {
  if (playerInfo.gameMode === 'solo') {
    // 솔로 모드는 클라이언트에서 처리
    toggleDiceHold(diceIndex);
  } else if (playerInfo.isTurn) {
    // PVP 모드는 서버에 요청 (자신의 턴일 때만)
    socket.emit('toggle-hold', { 
      roomCode: playerInfo.roomCode, 
      diceIndex: diceIndex
    });
  }
}

function selectScore(category) {
  if (playerInfo.gameMode === 'solo') {
    // 솔로 모드는 클라이언트에서 처리
    handleSoloSelectScore(category);
  } else if (playerInfo.isTurn) {
    // PVP 모드는 서버에 요청 (자신의 턴일 때만)
    socket.emit('select-score', { 
      roomCode: playerInfo.roomCode, 
      category: category
    });
  }
}

// 초기화 함수
document.addEventListener('DOMContentLoaded', () => {
  setupSocketListeners();
  setupUIEventListeners();
});
