const AdminDetails = require("../src/models/AdminModel");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10; // Recommended value

async function hashPassword(password) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  return hashedPassword;
}
function GenerateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}



module.exports = { hashPassword, GenerateOtp };
