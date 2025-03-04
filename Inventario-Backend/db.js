const mysql = require('mysql2/promise');

// Crear el pool de conexiones
const db = mysql.createPool({
    host: 'localhost', // Cambia esto si usas otro host
    user: 'root', // Tu usuario de MySQL
    password: 'My$QL2025!', // Tu contraseña de MySQL
    database: 'inventario', // El nombre de tu base de datos
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

module.exports = db;