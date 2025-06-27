const generateRoomCode = require("../utils/generateRoomCode");
const CodeCollection = require("../src/models/AdminModel");
const socketHandler = (io, socket) => {
  socket.on("admin", async () => {
    let Generatedcode ;
    while (1) {
      Generatedcode = generateRoomCode();
      const Exists = await CodeCollection.findOne({Code:Generatedcode});
      while (!Exists) {
        await CodeCollection.create({
          Code: Generatedcode,
        });
        break;
      }
      break;
    }

    console.log(Generatedcode);
    console.log("Socket Id", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected:", reason);
  });
};

module.exports = socketHandler;
