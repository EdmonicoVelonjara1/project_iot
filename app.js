const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const { Client } = require('ssh2');
const mysql = require('mysql');

// Configuration des constantes
const PORT = 3000;
const DEFAULT_USER_IP = '192.168.1.239';

const app = express();

app.engine('handlebars', engine({ defaultLayout: false }));
app.set('view engine', 'handlebars');
app.set('views', './views');

// Utiliser body-parser pour analyser les données POST
app.use(bodyParser.urlencoded({ extended: true }));

// Route pour afficher le formulaire
app.get('/', (req, res) => {
    res.render('unlockForm');
});

// Route POST pour déverrouiller le PC
app.post('/api/deverrouiller', (req, res) => {
    const { username, password } = req.body;

    // Validation simple des données
    if (!username || !password) {
        return res.status(400).send('<p>Erreur: Nom d\'utilisateur et mot de passe requis.</p><a href="/">Retour</a>');
    }

    unlockPC(DEFAULT_USER_IP, username, password, res);
});

// Fonction pour déverrouiller le PC via SSH
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


// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});

