// Middleware que verifica si el usuario tiene sesión activa
const verificarSesion = (req, res, next) => {
    if (req.session && req.session.usuario) {
        next(); // Si tiene sesión, continúa
    } else {
        res.status(401).json({ error: 'No autorizado, inicia sesión primero' });
    }
};

module.exports = verificarSesion;