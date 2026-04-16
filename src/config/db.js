// Importamos las dependencias necesarias
const mysql = require('mysql2');
require('dotenv').config();

// Creamos el pool de conexiones a la base de datos
const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit:    10,
});

// Exportamos el pool con soporte de promesas
module.exports = pool.promise();