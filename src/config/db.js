const mongoose = require('mongoose');

require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://yashrajdhamale:TwvNr435jG8uSX7b@streamusic.8e50o.mongodb.net/?retryWrites=true&w=majority&appName=Streamusic", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;