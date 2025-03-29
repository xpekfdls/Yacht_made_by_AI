// WebRTC connection handler
class WebRTCConnection {
  constructor() {
    this.socket = null;
    this.peerConnection = null;
    this.dataChannel = null;
    this.roomId = null;
    this.isCreator = false;
    this.peerId = null;
    this.isConnected = false;
    this.messageCallbacks = [];
    this.connectionStateCallbacks = [];
    
    // ICE server configuration (STUN servers)
    this.iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ]
    };
  }

  // Initialize socket connection
  initSocket() {
    this.socket = io();
    
    // Socket event handlers
    this.socket.on('room-created', ({ roomId }) => {
      console.log('Room created:', roomId);
      this.roomId = roomId;
      this.isCreator = true;
      
      // Notify about room creation
      this.notifyConnectionState({
        type: 'room-created',
        roomId: roomId
      });
    });
    
    this.socket.on('room-joined', ({ roomId, isCreator, creatorId }) => {
      console.log('Room joined:', roomId);
      this.roomId = roomId;
      this.isCreator = isCreator;
      this.peerId = creatorId;
      
      // If not the creator, initiate connection to creator
      if (!isCreator) {
        this.createPeerConnection();
        this.createOffer();
      }
      
      // Notify about room join
      this.notifyConnectionState({
        type: 'room-joined',
        roomId: roomId
      });
    });
    
    this.socket.on('peer-joined', ({ peerId }) => {
      console.log('Peer joined:', peerId);
      this.peerId = peerId;
      
      // Create the peer connection when someone joins our room
      this.createPeerConnection();
      
      // Notify about peer join
      this.notifyConnectionState({
        type: 'peer-joined',
        peerId: peerId
      });
    });
    
    this.socket.on('offer', async ({ offer, from }) => {
      console.log('Received offer from:', from);
      
      if (!this.peerConnection) {
        this.createPeerConnection();
      }
      
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        this.socket.emit('answer', {
          answer: answer,
          to: from
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });
    
    this.socket.on('answer', async ({ answer, from }) => {
      console.log('Received answer from:', from);
      
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });
    
    this.socket.on('ice-candidate', async ({ candidate, from }) => {
      console.log('Received ICE candidate from:', from);
      
      try {
        if (candidate) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });
    
    this.socket.on('peer-disconnected', ({ peerId }) => {
      console.log('Peer disconnected:', peerId);
      
      // Notify about peer disconnection
      this.notifyConnectionState({
        type: 'peer-disconnected',
        peerId: peerId
      });
      
      // Close and clean up the peer connection
      this.cleanupPeerConnection();
    });
    
    this.socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
      
      // Notify about error
      this.notifyConnectionState({
        type: 'error',
        message: message
      });
    });
  }
  
  // Create a new game room
  createRoom() {
    if (this.socket) {
      this.socket.emit('create-room');
    } else {
      console.error('Socket not initialized');
    }
  }
  
  // Join an existing room
  joinRoom(roomId) {
    if (this.socket) {
      this.socket.emit('join-room', { roomId });
    } else {
      console.error('Socket not initialized');
    }
  }
  
  // Create RTCPeerConnection
  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.iceServers);
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.peerId) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: this.peerId
        });
      }
    };
    
    // Connection state change handler
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      
      if (this.peerConnection.connectionState === 'connected') {
        this.isConnected = true;
        this.notifyConnectionState({
          type: 'connected'
        });
      } else if (this.peerConnection.connectionState === 'disconnected' || 
                this.peerConnection.connectionState === 'failed') {
        this.isConnected = false;
        this.notifyConnectionState({
          type: 'disconnected'
        });
      }
    };
    
    // Create data channel if creator
    if (this.isCreator) {
      this.createDataChannel();
    } else {
      // If not creator, listen for the data channel
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel();
      };
    }
  }
  
  // Create data channel
  createDataChannel() {
    try {
      this.dataChannel = this.peerConnection.createDataChannel('gameData', {
        ordered: true
      });
      this.setupDataChannel();
    } catch (error) {
      console.error('Error creating data channel:', error);
    }
  }
  
  // Setup data channel event handlers
  setupDataChannel() {
    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.isConnected = true;
      this.notifyConnectionState({
        type: 'datachannel-open'
      });
    };
    
    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      this.isConnected = false;
      this.notifyConnectionState({
        type: 'datachannel-close'
      });
    };
    
    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      this.notifyConnectionState({
        type: 'datachannel-error',
        error: error
      });
    };
    
    this.dataChannel.onmessage = (event) => {
      // Parse the message data
      try {
        const message = JSON.parse(event.data);
        this.notifyMessageReceived(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  }
  
  // Create and send offer
  async createOffer() {
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      this.socket.emit('offer', {
        offer: offer,
        to: this.peerId
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }
  
  // Send message via data channel
  sendMessage(type, data) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const message = {
        type: type,
        data: data,
        timestamp: Date.now()
      };
      
      this.dataChannel.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('Data channel not open, cannot send message');
      return false;
    }
  }
  
  // Register callback for received messages
  onMessage(callback) {
    if (typeof callback === 'function') {
      this.messageCallbacks.push(callback);
    }
  }
  
  // Register callback for connection state changes
  onConnectionStateChange(callback) {
    if (typeof callback === 'function') {
      this.connectionStateCallbacks.push(callback);
    }
  }
  
  // Notify all registered message callbacks
  notifyMessageReceived(message) {
    this.messageCallbacks.forEach(callback => {
      callback(message);
    });
  }
  
  // Notify all registered connection state callbacks
  notifyConnectionState(state) {
    this.connectionStateCallbacks.forEach(callback => {
      callback(state);
    });
  }
  
  // Clean up peer connection
  cleanupPeerConnection() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.isConnected = false;
  }
  
  // Cleanup all connections
  cleanup() {
    this.cleanupPeerConnection();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.roomId = null;
    this.isCreator = false;
    this.peerId = null;
    this.messageCallbacks = [];
    this.connectionStateCallbacks = [];
  }
  
  // Check if connected to peer
  isConnectedToPeer() {
    return this.isConnected && 
           this.dataChannel && 
           this.dataChannel.readyState === 'open';
  }
  
  // Auto-reconnect attempt
  attemptReconnect() {
    this.cleanupPeerConnection();
    
    if (this.roomId) {
      if (this.isCreator) {
        this.createPeerConnection();
      } else {
        this.joinRoom(this.roomId);
      }
    }
  }
}

// Export as singleton
const webRTCConnection = new WebRTCConnection();
