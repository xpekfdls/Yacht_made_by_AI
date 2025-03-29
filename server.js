// Express 서버 설정
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// 게임 로직 모듈 불러오기
const RoomManager = require('./src/room');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 방 관리자 인스턴스 생성
const roomManager = new RoomManager();

// 소켓 연결 처리
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // 솔로 게임 시작
  socket.on('start-solo', () => {
    console.log(`User ${socket.id} started a solo game`);
    // 솔로 게임은 서버에서 특별한 처리가 필요 없음 (클라이언트에서 처리)
    socket.emit('solo-started');
  });

  // 방 생성
  socket.on('create-room', (playerName) => {
    const roomCode = roomManager.createRoom(socket.id, playerName);
    console.log(`User ${socket.id} (${playerName}) created room: ${roomCode}`);
    
    socket.join(roomCode);
    socket.emit('room-created', { roomCode, playerId: socket.id });
  });

  // 방 참가
  socket.on('join-room', ({ roomCode, playerName }) => {
    const joinResult = roomManager.joinRoom(roomCode, socket.id, playerName);
    
    if (joinResult.success) {
      socket.join(roomCode);
      console.log(`User ${socket.id} (${playerName}) joined room: ${roomCode}`);
      
      // 방 정보 전송
      socket.emit('room-joined', { 
        roomCode, 
        playerId: socket.id,
        players: joinResult.players,
        currentTurn: joinResult.currentTurn
      });
      
      // 다른 플레이어에게 새 플레이어 참가 알림
      socket.to(roomCode).emit('player-joined', {
        playerId: socket.id,
        playerName: playerName,
        players: joinResult.players,
        currentTurn: joinResult.currentTurn
      });
      
      // 게임이 시작 가능한 상태라면 게임 시작
      if (joinResult.gameReady) {
        io.to(roomCode).emit('game-started', {
          players: joinResult.players,
          currentTurn: joinResult.currentTurn
        });
      }
    } else {
      socket.emit('join-error', { error: joinResult.error });
    }
  });

  // 주사위 굴리기
  socket.on('roll-dice', ({ roomCode, rollCount }) => {
    const room = roomManager.getRoom(roomCode);
    
    if (room && room.currentTurn === socket.id) {
      const diceResult = roomManager.rollDice(roomCode);
      
      // 모든 플레이어에게 주사위 결과 전송
      io.to(roomCode).emit('dice-rolled', {
        dice: diceResult,
        rollCount: rollCount,
        playerId: socket.id
      });
    }
  });

  // 주사위 고정
  socket.on('toggle-hold', ({ roomCode, diceIndex }) => {
    const room = roomManager.getRoom(roomCode);
    
    if (room && room.currentTurn === socket.id) {
      roomManager.toggleHold(roomCode, diceIndex);
      
      // 모든 플레이어에게 고정 상태 변경 알림
      io.to(roomCode).emit('hold-toggled', {
        diceIndex: diceIndex,
        playerId: socket.id,
        holds: room.diceHolds
      });
    }
  });

  // 점수 선택
  socket.on('select-score', ({ roomCode, category }) => {
    const room = roomManager.getRoom(roomCode);
    
    if (room && room.currentTurn === socket.id) {
      const result = roomManager.selectScore(roomCode, socket.id, category);
      
      if (result.success) {
        // 점수 업데이트 및 턴 변경
        io.to(roomCode).emit('score-selected', {
          playerId: socket.id,
          category: category,
          score: result.score,
          scoreCard: result.scoreCard,
          nextTurn: result.nextTurn
        });
        
        // 게임 종료 체크
        if (result.gameOver) {
          io.to(roomCode).emit('game-over', {
            winner: result.winner,
            scores: result.finalScores
          });
        }
      }
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // 유저가 속한 방에서 제거
    const rooms = roomManager.getRoomsByPlayerId(socket.id);
    
    rooms.forEach(roomCode => {
      const result = roomManager.removePlayer(roomCode, socket.id);
      
      if (result.roomRemoved) {
        // 방이 완전히 삭제된 경우
        console.log(`Room ${roomCode} removed as all players left`);
      } else if (result.success) {
        // 다른 플레이어에게 퇴장 알림
        socket.to(roomCode).emit('player-left', {
          playerId: socket.id,
          players: result.players,
          currentTurn: result.currentTurn,
          gameOver: result.gameOver
        });
        
        if (result.gameOver) {
          socket.to(roomCode).emit('game-over', {
            winner: result.winner,
            reason: 'opponent-left'
          });
        }
      }
    });
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
