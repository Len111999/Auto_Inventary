const connection = require('./db');

connection.query('SELECT VERSION()', (err, results) =>{
    if(err){
        console.error("Error ejecutando la consulta:", err.message);
        return;
    }
    console.log('Version de MySQL: ', results[0]);
});