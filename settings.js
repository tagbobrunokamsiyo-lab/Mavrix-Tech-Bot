// ╔══════════════════════════════════════════════════════════════╗
// ║                   MAVRIX BOT CONFIGURATION                   ║
// ║                    QUANTUM EDITION v2.2.1                    ║
// ╚══════════════════════════════════════════════════════════════╝

const settings = {
  // ┌────────────────────────────────────────────────────────────┐
  // │                    IDENTITY CONFIGURATION                   │
  // └────────────────────────────────────────────────────────────┘
  packname: 'Mavrix Bot',
  author: '‎',
  botName: "Mavrix Bot", // Neural network instance identifier, feel free to change the name 
  botOwner: 'MONTANA', // System administrator designation, feel free to change the name
  
  // ┌────────────────────────────────────────────────────────────┐
  // │                    NETWORK CONFIGURATION                    │
  // └────────────────────────────────────────────────────────────┘
  ownerNumber: '2349013475255', // Primary node contact, replace with your number used to generate session id
  
  // ┌────────────────────────────────────────────────────────────┐
  // │                    API INTEGRATION LAYER                    │
  // └────────────────────────────────────────────────────────────┘
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq', // Multimedia service token
  
  // ┌────────────────────────────────────────────────────────────┐
  // │                    SYSTEM ARCHITECTURE                      │
  // └────────────────────────────────────────────────────────────┘
  commandMode: "public", // Access protocol: public/private
  maxStoreMessages: 20, // Message buffer cache limit
  storeWriteInterval: 10000, // Data persistence interval (ms)
  
  // ┌────────────────────────────────────────────────────────────┐
  // │                    SYSTEM METADATA                         │
  // └────────────────────────────────────────────────────────────┘
  description: "Advanced neural network orchestrator featuring real-time message queuing, distributed command processing, automated workflow automation, multi-protocol API integration, and intelligent response generation with machine learning capabilities.",
  version: "2.2.1",
  updateZipUrl: "https://github.com/Marvex18/Mavrix-Tech-Bot/archive/refs/heads/main.zip",
};

// ╔══════════════════════════════════════════════════════════════╗
// ║              CONFIGURATION EXPORT - DO NOT MODIFY            ║
// ╚══════════════════════════════════════════════════════════════╝
module.exports = settings;
