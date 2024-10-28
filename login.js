const { Client } = require('ssh2');
const mysql = require('mysql');

const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'venico',
    password : 'poulecoq',
    database : 'manage_student'
});

const UID = 'tahina_id';
connection.connect();

connection.query('SELECT * from student_login', function (error, results, fields) {
    if (error) throw error;
    for (let i = 0; i < results.length; i++) {
      //console.log(`ID: ${results[i].id}, Username: ${results[i].pseudoname}, IP: ${results[i].ip_address}, UID RFID: ${results[i].id_rfid}`);
        if(UID == results[i].id_rfid){
            console.log("Accès autorisé");
            console.log(`ID: ${results[i].id}, Username: ${results[i].pseudoname}, IP: ${results[i].ip_address}, UID RFID: ${results[i].id_rfid}`);

            unlockPC(results[i].ip_address, results[i].pseudoname, results[i].password);
            break;
        } else if(results.length == i+1 && results[i].id_rfid != UID){
            console.log("Accès non autorisé");
        }
    }
    console.log("ICII");
});
  
connection.end();

//Déverrouillage du PC via SSH
const unlockPC = (ip, username, password) => {
    const conn = new Client();
    conn.on('ready', () => {
        console.log(`Connecté à ${username}@${ip}`);
        
        // Récupérer l'ID de session pour l'utilisateur donné
        const command = `loginctl list-sessions | grep ${username} | awk '{print $1}'`;
        
        conn.exec(command, (err, stream) => {
            if (err) throw err;

            let sessionId = '';
            stream.on('data', (data) => {
                sessionId = data.toString().trim(); // Récupérer l'ID de session
                console.log(`Session ID trouvée : ${sessionId}`);

                if (sessionId) {
                    conn.exec(`loginctl unlock-session ${sessionId}`, (err) => {
                        if (err) throw err;
                        console.log(`Session de ${username} déverrouillée.`);
                        conn.end();
                    });
                } else {
                    console.log('Aucune session trouvée pour cet utilisateur.');
                    conn.end();
                }
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }).connect({
        host: ip,
        port: 22,
        username: username,
        password: password,
    });
};

