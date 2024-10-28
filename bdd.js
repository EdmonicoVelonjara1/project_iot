const mysql = require('mysql');
const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'venico',
    password : 'poulecoq',
    database : 'manage_student'
  });

  const UID = 'd_id';
  connection.connect();

  connection.query('SELECT * from student_login', function (error, results, fields) {
    if (error) throw error;
    for (let i = 0; i < results.length; i++) {
      console.log(`ID: ${results[i].id}, Username: ${results[i].pseudoname}, IP: ${results[i].ip_address}, UID RFID: ${results[i].id_rfid}`);
        if(UID == results[i].id_rfid){
            console.log("Accès autorisé");
            break;
        } else if(results.length == i+1 && results[i].id_rfid != UID){
            console.log("Accès non autorisé");
        } 
    }
    console.log("ICII");
  });
   
  connection.end();
  