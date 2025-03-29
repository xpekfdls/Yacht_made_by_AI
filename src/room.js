// 방 관리 로직
class RoomManager {
  constructor() {
    this.rooms = {};
  }

  // 6자리 랜덤 방 코드 생성
  generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  // 새로운 방 생성
  createRoom(playerId, playerName) {
    let roomCode;
    // 유니크한 방 코드 생성
    do {
      roomCode = this.generateRoomCode();
    } while (this.rooms[roomCode]);

    this.rooms[roomCode] = {
      players: {
        [playerId]: {
          name: playerName,
          scoreCard: this.createEmptyScoreCard(),
          totalScore: 0
        }
      },
      playerIds: [playerId],
      currentTurn: playerId,
      dice: this.rollNewDice(),
      diceHolds: [false, false, false, false, false],
      gameState: 'waiting', // 'waiting', 'playing', 'finished'
      rollCount: 0
    };

    return roomCode;
  }

  // 방 참가
  joinRoom(roomCode, playerId, playerName) {
    // 방이 존재하는지 확인
    if (!this.rooms[roomCode]) {
      return { success: false, error: '존재하지 않는 방입니다.' };
    }

    const room = this.rooms[roomCode];

    // 방이 가득 찼는지 확인 (2명 제한)
    if (Object.keys(room.players).length >= 2) {
      return { success: false, error: '방이 가득 찼습니다.' };
    }

    // 게임이 이미 시작됐는지 확인
    if (room.gameState === 'playing') {
      return { success: false, error: '게임이 이미 진행 중입니다.' };
    }

    // 플레이어 추가
    room.players[playerId] = {
      name: playerName,
      scoreCard: this.createEmptyScoreCard(),
      totalScore: 0
    };
    room.playerIds.push(playerId);

    // 2명이 모이면 게임 시작
    const gameReady = Object.keys(room.players).length === 2;
    if (gameReady) {
      room.gameState = 'playing';
      room.currentTurn = room.playerIds[0]; // 첫 번째 플레이어부터 시작
      room.dice = this.rollNewDice();
      room.diceHolds = [false, false, false, false, false];
      room.rollCount = 0;
    }

    return {
      success: true,
      players: room.players,
      currentTurn: room.currentTurn,
      gameReady
    };
  }

  // 방 정보 가져오기
  getRoom(roomCode) {
    return this.rooms[roomCode];
  }

  // 플레이어 ID로 속한 방 코드 목록 가져오기
  getRoomsByPlayerId(playerId) {
    return Object.keys(this.rooms).filter(roomCode => 
      this.rooms[roomCode].players[playerId]);
  }

  // 플레이어 제거
  removePlayer(roomCode, playerId) {
    const room = this.rooms[roomCode];
    if (!room || !room.players[playerId]) {
      return { success: false };
    }

    // 플레이어 제거
    delete room.players[playerId];
    room.playerIds = room.playerIds.filter(id => id !== playerId);

    // 방에 플레이어가 남아있지 않으면 방 삭제
    if (room.playerIds.length === 0) {
      delete this.rooms[roomCode];
      return { success: true, roomRemoved: true };
    }

    // 게임 중이었다면 게임 종료 처리
    const gameOver = room.gameState === 'playing';
    if (gameOver) {
      room.gameState = 'finished';
      const winner = room.playerIds[0]; // 남은 유일한 플레이어
      
      return {
        success: true,
        roomRemoved: false,
        players: room.players,
        currentTurn: null,
        gameOver,
        winner
      };
    }

    // 현재 턴이 나간 플레이어라면 턴 변경
    if (room.currentTurn === playerId) {
      room.currentTurn = room.playerIds[0];
    }

    return {
      success: true,
      roomRemoved: false,
      players: room.players,
      currentTurn: room.currentTurn,
      gameOver: false
    };
  }

  // 주사위 굴리기
  rollDice(roomCode) {
    const room = this.rooms[roomCode];
    if (!room) return null;

    // 고정되지 않은 주사위만 다시 굴림
    for (let i = 0; i < 5; i++) {
      if (!room.diceHolds[i]) {
        room.dice[i] = Math.floor(Math.random() * 6) + 1;
      }
    }

    room.rollCount++;
    return room.dice;
  }

  // 새로운 주사위 생성 및 굴리기
  rollNewDice() {
    const dice = [];
    for (let i = 0; i < 5; i++) {
      dice.push(Math.floor(Math.random() * 6) + 1);
    }
    return dice;
  }

  // 주사위 고정 토글
  toggleHold(roomCode, diceIndex) {
    const room = this.rooms[roomCode];
    if (!room || diceIndex < 0 || diceIndex >= 5) return;

    room.diceHolds[diceIndex] = !room.diceHolds[diceIndex];
  }

  // 빈 점수 카드 생성
  createEmptyScoreCard() {
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

  // 점수 선택
  selectScore(roomCode, playerId, category) {
    const room = this.rooms[roomCode];
    if (!room || room.currentTurn !== playerId) {
      return { success: false };
    }

    const player = room.players[playerId];
    
    // 이미 선택된 카테고리인지 확인
    if (player.scoreCard[category] !== null) {
      return { success: false, error: '이미 선택된 카테고리입니다.' };
    }

    // 점수 계산
    const score = this.calculateScore(room.dice, category);
    
    // 점수 업데이트
    player.scoreCard[category] = score;
    player.totalScore = this.calculateTotalScore(player.scoreCard);

    // 다음 턴으로 넘기기
    const currentPlayerIndex = room.playerIds.indexOf(playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % room.playerIds.length;
    room.currentTurn = room.playerIds[nextPlayerIndex];
    
    // 새 턴을 위해 주사위 초기화
    room.dice = this.rollNewDice();
    room.diceHolds = [false, false, false, false, false];
    room.rollCount = 0;

    // 게임 종료 체크
    const isGameOver = this.checkGameOver(roomCode);
    let winner = null;
    let finalScores = {};
    
    if (isGameOver) {
      room.gameState = 'finished';
      
      // 승자 결정
      let maxScore = -1;
      
      for (const pid of room.playerIds) {
        const playerScore = room.players[pid].totalScore;
        finalScores[pid] = playerScore;
        
        if (playerScore > maxScore) {
          maxScore = playerScore;
          winner = pid;
        }
      }
    }

    return {
      success: true,
      score,
      scoreCard: player.scoreCard,
      nextTurn: room.currentTurn,
      gameOver: isGameOver,
      winner,
      finalScores
    };
  }

  // 게임 종료 체크 (모든 플레이어의 점수 카드가 가득 찼는지)
  checkGameOver(roomCode) {
    const room = this.rooms[roomCode];
    if (!room) return false;

    for (const playerId of room.playerIds) {
      const scoreCard = room.players[playerId].scoreCard;
      
      // 빈 카테고리가 있는지 확인
      const hasEmptyCategory = Object.values(scoreCard).some(score => score === null);
      
      if (hasEmptyCategory) {
        return false; // 아직 빈 카테고리가 있음
      }
    }
    
    return true; // 모든 플레이어의 모든 카테고리가 채워짐
  }

  // 총점 계산
  calculateTotalScore(scoreCard) {
    let total = 0;
    
    // 모든 카테고리 점수 합산
    for (const category in scoreCard) {
      if (scoreCard[category] !== null) {
        total += scoreCard[category];
      }
    }
    
    // 상단 섹션 보너스 체크 (Ones~Sixes 합계가 63 이상이면 35점 보너스)
    const upperSection = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
    let upperTotal = 0;
    
    for (const category of upperSection) {
      if (scoreCard[category] !== null) {
        upperTotal += scoreCard[category];
      }
    }
    
    if (upperTotal >= 63) {
      total += 35; // 보너스 35점
    }
    
    return total;
  }

  // 점수 계산 로직
  calculateScore(dice, category) {
    // 주사위 숫자별 개수 카운트
    const counts = {};
    for (const value of dice) {
      counts[value] = (counts[value] || 0) + 1;
    }

    switch (category) {
      // 상단 섹션 (숫자 카테고리)
      case 'ones':
        return this.sumDiceWithValue(dice, 1);
      case 'twos':
        return this.sumDiceWithValue(dice, 2);
      case 'threes':
        return this.sumDiceWithValue(dice, 3);
      case 'fours':
        return this.sumDiceWithValue(dice, 4);
      case 'fives':
        return this.sumDiceWithValue(dice, 5);
      case 'sixes':
        return this.sumDiceWithValue(dice, 6);
      
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
  sumDiceWithValue(dice, targetValue) {
    return dice.reduce((sum, value) => {
      return value === targetValue ? sum + value : sum;
    }, 0);
  }
}

module.exports = RoomManager;
