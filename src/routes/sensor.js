const express        = require('express');
const router         = express.Router();
const db             = require('../config/db');
const verificarSesion = require('../middlewares/auth');

// ── RECIBIR DATOS DEL ESP32 ──────────────────────────────
// Esta ruta la llamará el ESP32 para enviar lecturas
router.post('/data', async (req, res) => {
    const { humedad, sensor_id } = req.body;

    // Validamos que venga el dato de humedad
    if (humedad === undefined || humedad === null) {
        return res.status(400).json({ error: 'El valor de humedad es obligatorio' });
    }

    try {
        await db.query(
            'INSERT INTO lecturas_sensor (humedad, sensor_id) VALUES (?, ?)',
            [humedad, sensor_id || 'ESP32-01']
        );

        res.status(201).json({ mensaje: 'Lectura registrada correctamente' });

    } catch (error) {
        console.error('Error al guardar lectura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ── OBTENER ÚLTIMAS LECTURAS (protegido) ─────────────────
router.get('/lecturas', verificarSesion, async (req, res) => {
    try {
        const [lecturas] = await db.query(
            `SELECT humedad, sensor_id, registrado_en
             FROM lecturas_sensor
             ORDER BY registrado_en DESC
             LIMIT 50`
        );

        res.json({ lecturas });

    } catch (error) {
        console.error('Error al obtener lecturas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ── OBTENER PROMEDIO DEL DÍA (protegido) ─────────────────
router.get('/promedio', verificarSesion, async (req, res) => {
    try {
        const [resultado] = await db.query(
            `SELECT ROUND(AVG(humedad), 2) AS promedio
             FROM lecturas_sensor
             WHERE DATE(registrado_en) = CURDATE()`
        );

        res.json({ promedio: resultado[0].promedio });

    } catch (error) {
        console.error('Error al obtener promedio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ── OBTENER ÚLTIMA LECTURA (protegido) ───────────────────
router.get('/ultima', verificarSesion, async (req, res) => {
    try {
        const [resultado] = await db.query(
            `SELECT humedad, sensor_id, registrado_en
             FROM lecturas_sensor
             ORDER BY registrado_en DESC
             LIMIT 1`
        );

        if (resultado.length === 0) {
            return res.json({ ultima: null });
        }

        res.json({ ultima: resultado[0] });

    } catch (error) {
        console.error('Error al obtener última lectura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;