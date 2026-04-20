const express = require('express');
const session = require('express-session');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesiones
app.use(session({
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 horas
}));

// Rutas de vistas
app.get('/',          (req, res) => res.sendFile(path.join(__dirname, 'views/login.html')));
app.get('/signup',    (req, res) => res.sendFile(path.join(__dirname, 'views/signup.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views/dashboard.html')));
app.get('/about',     (req, res) => res.sendFile(path.join(__dirname, 'views/about.html')));
app.get('/docs', (req, res) => res.sendFile(path.join(__dirname, 'views/docs.html')));

// Rutas de la API
app.use('/api/auth',   require('./src/routes/auth'));
app.use('/api/sensor', require('./src/routes/sensor'));
app.use('/api/publica', require('./src/routes/publica'));

// Iniciamos el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

