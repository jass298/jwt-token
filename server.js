# jwt-token

const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bodyparser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

app.use(cors());
dotenv.config();
process.env.JWT_SECRET_KEY = "demosecretkey";
const PORT = process.env.PORT || 5000;

// ✅ Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

// Serve static files (HTML, JS, CSS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'jwt'
});

conn.connect((err) => {
    if (err) throw err;
    console.log('MySQL connected...');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.post('/generatetoken', (req, res) => {

    let jwtsecretkey = process.env.JWT_SECRET_KEY;
    console.log(jwtsecretkey);

    const { username, email, password } = req.body;
    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Username ,Email and password required' });
    }
    const data = {
        email,
        username,
        time: new Date(),
    };

    const token = jwt.sign(data, jwtsecretkey, { expiresIn: '1h' })
  
    console.log(token)

    //storing into backend

    const sql = "INSERT INTO users (username, email, password ) VALUES (?, ?, ?)";
    const values = [username, email, password];

    conn.query(sql, values, (err, result) => {
        if (err) {
            console.error('DB Error:', err);
            return res.status(500).json({ error: 'Failed to register user' });
        }
        console.log('User registered successfully');
        return res.status(200).json({ token, message: 'Token generated successfully' });
    });
})


app.get('/verifytoken', (req, res) => {


    let jwtsecretkey = process.env.JWT_SECRET_KEY;

    try {
        console.log('Verifying token...');
        const authheader = req.headers['authorization'];
        if (!authheader) {
         return res.status(401).send('authorization header is missing')
        }
        console.log(authheader);
        const verified = jwt.verify(authheader, jwtsecretkey)

        if (verified) {
            return res.send('successfully verified');
        }

    }
    catch (error) {
        return res.status(401).send(error.message);
    }
})


app.listen(PORT, (() => {
    console.log(`server is running on port ${PORT}`);
}))
