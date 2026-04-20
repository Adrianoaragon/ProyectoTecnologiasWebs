const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── CABECERAS CORS ───────────────────────────────────────
// Permitimos que cualquier aplicación externa consuma esta API
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// ── ÚLTIMAS 50 LECTURAS ──────────────────────────────────
router.get('/lecturas', async (req, res) => {
    try {
        const [lecturas] = await db.query(
            `SELECT 
                id,
                humedad,
                sensor_id,
                registrado_en
             FROM lecturas_sensor
             ORDER BY registrado_en DESC
             LIMIT 50`
        );

        res.json({
            ok:      true,
            total:   lecturas.length,
            datos:   lecturas
        });

    } catch (error) {
        console.error('Error API pública /lecturas:', error);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
});

// ── ÚLTIMA LECTURA ───────────────────────────────────────
router.get('/ultima', async (req, res) => {
    try {
        const [resultado] = await db.query(
            `SELECT 
                id,
                humedad,
                sensor_id,
                registrado_en
             FROM lecturas_sensor
             ORDER BY registrado_en DESC
             LIMIT 1`
        );

        if (resultado.length === 0) {
            return res.json({ ok: true, dato: null });
        }

        res.json({
            ok:   true,
            dato: resultado[0]
        });

    } catch (error) {
        console.error('Error API pública /ultima:', error);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
});

// ── PROMEDIO DEL DÍA ─────────────────────────────────────
router.get('/promedio', async (req, res) => {
    try {
        const [resultado] = await db.query(
            `SELECT 
                ROUND(AVG(humedad), 2)  AS promedio,
                MAX(humedad)            AS maximo,
                MIN(humedad)            AS minimo,
                COUNT(*)                AS total_lecturas,
                DATE(registrado_en)     AS fecha
             FROM lecturas_sensor
             WHERE DATE(registrado_en) = CURDATE()
             GROUP BY DATE(registrado_en)`
        );

        if (resultado.length === 0) {
            return res.json({ ok: true, dato: null, mensaje: 'Sin lecturas hoy' });
        }

        res.json({
            ok:   true,
            dato: resultado[0]
        });

    } catch (error) {
        console.error('Error API pública /promedio:', error);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
});

// ── HISTORIAL POR DÍAS ───────────────────────────────────
router.get('/historial', async (req, res) => {
    // Si no especifican días, mostramos los últimos 7 por defecto
    let dias = parseInt(req.query.dias) || 7;

    // Limitamos a máximo 30 días para no sobrecargar
    if (dias > 30) dias = 30;
    if (dias < 1)  dias = 1;

    try {
        const [lecturas] = await db.query(
            `SELECT 
                id,
                humedad,
                sensor_id,
                registrado_en
             FROM lecturas_sensor
             WHERE registrado_en >= DATE_SUB(NOW(), INTERVAL ? DAY)
             ORDER BY registrado_en DESC`,
            [dias]
        );

        res.json({
            ok:      true,
            dias:    dias,
            total:   lecturas.length,
            datos:   lecturas
        });

    } catch (error) {
        console.error('Error API pública /historial:', error);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
});

// ── ESTADÍSTICAS GENERALES ───────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const [resultado] = await db.query(
            `SELECT
                COUNT(*)                        AS total_lecturas,
                ROUND(AVG(humedad), 2)          AS promedio_global,
                MAX(humedad)                    AS maximo_historico,
                MIN(humedad)                    AS minimo_historico,
                MIN(registrado_en)              AS primera_lectura,
                MAX(registrado_en)              AS ultima_lectura
             FROM lecturas_sensor`
        );

        res.json({
            ok:   true,
            dato: resultado[0]
        });

    } catch (error) {
        console.error('Error API pública /stats:', error);
        res.status(500).json({ ok: false, error: 'Error interno del servidor' });
    }
});

module.exports = router;