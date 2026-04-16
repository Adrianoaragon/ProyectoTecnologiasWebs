const express  = require('express');
const bcrypt   = require('bcryptjs');
const router   = express.Router();
const db       = require('../config/db');

// ── REGISTRO DE USUARIO ──────────────────────────────────
router.post('/signup', async (req, res) => {
    const { nombre, email, password } = req.body;

    // Validamos que vengan todos los campos
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        // Verificamos si el email ya existe
        const [existe] = await db.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existe.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Encriptamos la contraseña
        const hash = await bcrypt.hash(password, 10);

        // Insertamos el usuario en la base de datos
        await db.query(
            'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, hash]
        );

        res.status(201).json({ mensaje: 'Usuario registrado correctamente' });

    } catch (error) {
        console.error('Error en signup:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ── LOGIN ────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validamos que vengan los campos
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    try {
        // Buscamos el usuario por email
        const [usuarios] = await db.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const usuario = usuarios[0];

        // Comparamos la contraseña con el hash
        const passwordCorrecta = await bcrypt.compare(password, usuario.password);

        if (!passwordCorrecta) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Guardamos la sesión
        req.session.usuario = {
            id:     usuario.id,
            nombre: usuario.nombre,
            email:  usuario.email,
            rol:    usuario.rol
        };

        res.json({ mensaje: 'Login exitoso', usuario: req.session.usuario });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ── LOGOUT ───────────────────────────────────────────────
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ mensaje: 'Sesión cerrada correctamente' });
    });
});

// ── VERIFICAR SESIÓN ACTIVA ──────────────────────────────
router.get('/me', (req, res) => {
    if (req.session.usuario) {
        res.json({ usuario: req.session.usuario });
    } else {
        res.status(401).json({ error: 'No hay sesión activa' });
    }
});

module.exports = router;