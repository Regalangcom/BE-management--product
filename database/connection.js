// database/connection.js
const mysql2 = require("mysql2");
require('dotenv').config();

let connectionParams;

const useLocalhost = process.env.USE_LOCALHOST === 'true';

if (useLocalhost) {
    console.log("Inside local")
    connectionParams = {
        user: "root",
        host: "localhost",
        password: "Galangdb00",
        database: "E_commerce",
    };
} else {
    connectionParams = {
        user: process.env.DB_SERVER_USER,
        host: process.env.DB_SERVER_HOST,
        password: process.env.DB_SERVER_PASSWORD,
        database: process.env.DB_SERVER_DATABASE,
    };
}

// Buat koneksi dan ubah ke promise
const pool = mysql2.createConnection(connectionParams).promise();

// Export the pool
module.exports = pool;


