const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store active room data
const rooms = {};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Create a new game room
  socket.on('create-room', () => {
    const roomId = uuidv4().substring(0, 6).toUpperCase(); // Generate short room code
    rooms[roomId] = {
      creator: socket.id,
      peers: [socket.id],
      full: false
    };
    
    socket.join(roomId);
    socket.emit('room-created', { roomId });
    console.log(`Room created: ${roomId} by ${socket.id}`);
  });
  
  // Join an existing room
  socket.on('join-room', ({ roomId }) => {
    const room = rooms[roomId];
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (room.peers.length >= 2) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    
    // Join the room
    socket.join(roomId);
    room.peers.push(socket.id);
    room.full = room.peers.length >= 2;
    
    // Notify the room creator
    socket.to(room.creator).emit('peer-joined', { peerId: socket.id });
    socket.emit('room-joined', { 
      roomId, 
      isCreator: false, 
      creatorId: room.creator 
    });
    
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  
  // WebRTC signaling
  socket.on('offer', ({ offer, to }) => {
    console.log(`Relaying offer from ${socket.id} to ${to}`);
    socket.to(to).emit('offer', {
      offer,
      from: socket.id
    });
  });
  
  socket.on('answer', ({ answer, to }) => {
    console.log(`Relaying answer from ${socket.id} to ${to}`);
    socket.to(to).emit('answer', {
      answer,
      from: socket.id
    });
  });
  
  socket.on('ice-candidate', ({ candidate, to }) => {
    console.log(`Relaying ICE candidate from ${socket.id} to ${to}`);
    socket.to(to).emit('ice-candidate', {
      candidate,
      from: socket.id
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and clean up rooms
    for (const roomId in rooms) {
      const room = rooms[roomId];
      
      // Remove user from peers
      const index = room.peers.indexOf(socket.id);
      if (index !== -1) {
        room.peers.splice(index, 1);
        room.full = room.peers.length >= 2;
        
        // Notify remaining peer about disconnection
        if (room.peers.length > 0) {
          io.to(roomId).emit('peer-disconnected', { peerId: socket.id });
        }
        
        console.log(`User ${socket.id} removed from room ${roomId}`);
        
        // Delete empty rooms
        if (room.peers.length === 0) {
          delete rooms[roomId];
          console.log(`Empty room deleted: ${roomId}`);
        }
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
