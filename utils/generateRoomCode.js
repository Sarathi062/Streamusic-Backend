const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase(); // Example: 'A1B2C3'
};

module.exports = generateRoomCode;