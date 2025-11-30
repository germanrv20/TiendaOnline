// routes/router_usuarios.js
import { Router } from 'express';
import Usuario from '../model/Usuario.js';
import jwt from 'jsonwebtoken';
import logger from '../logger.js';

const router = Router();

// --- VISTAS DE FORMULARIO ---
router.get('/login', (req, res) => {
    res.render("login.html", { errors: {} });
});

router.get('/registro', (req, res) => {
    res.render("registro.html", { errors: {} });
});

// --- LÓGICA DE AUTENTICACIÓN ---

// Recoge datos del formulario de registro
router.post('/registro', async(req, res) => {
    const { username, password } = req.body;
    let errors = {};

    if (!username) {
        errors.username = "El nombre de usuario es obligatorio";
    }
    if (!password) {
        errors.password = "La contraseña es obligatoria";
    }
    if (Object.keys(errors).length > 0) {
        return res.render("registro.html", { errors });
    }

    try {
        const existingUser = await Usuario.findOne({ username });
        if (existingUser) {
            errors.username = "El nombre de usuario ya existe";
            return res.render("registro.html", { errors });
        }

        const newUser = new Usuario({ username, password });
        await newUser.save();

        logger.info(`Nuevo usuario registrado: ${username}`);

        const token = jwt.sign({ usuario: newUser.username, admin: newUser.admin },
            process.env.SECRET_KEY
        );

        res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.IN === 'production'
        }).redirect("/");

    } catch (err) {

        logger.error(`Error en POST /usuarios/registro: ${err.message}`);
        res.render("registro.html", { errors: { general: "Error al registrar el usuario" } });
    }
});

// Recoge datos del formulario de login
router.post('/login', async(req, res) => {
    const { username, password } = req.body;
    let errors = {};

    if (!username) {
        errors.username = "El nombre de usuario es obligatorio";
    }
    if (!password) {
        errors.password = "La contraseña es obligatoria";
    }
    if (Object.keys(errors).length > 0) {
        return res.render("login.html", { errors });
    }

    try {
        const user = await Usuario.findOne({ username });
        if (!user) {
            // (Nota: Hay un 'usuarios' suelto aquí en tu código original, lo he quitado)
            errors.username = "Usuario o contraseña incorrectos";
            return res.render("login.html", { errors });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            errors.password = "Usuario o contraseña incorrectos";
            return res.render("login.html", { errors });
        }

        const token = jwt.sign({ usuario: user.username, admin: user.admin },
            process.env.SECRET_KEY
        );

        logger.info(`Usuario logueado: ${username}`);

        res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.IN === 'production'
        }).redirect("/");

    } catch (err) {

        logger.error(`Error en POST /usuarios/login (usuario: ${username}): ${err.message}`);
        res.render("login.html", { errors: { general: "Error al iniciar sesión" } });
    }
});

// Ruta de Logout
router.get('/logout', (req, res, next) => {
    const username = req.username; // Capturamos el nombre antes de destruir la sesión
    res.clearCookie("access_token");

    req.session.destroy((err) => {
        if (err) {

            logger.error(`Error al destruir la sesión (usuario: ${username}): ${err.message}`);
            return next(err);
        }
        logger.info(`Usuario deslogueado: ${username || 'invitado'}`);
        res.redirect('/');
    });
});

export default router;