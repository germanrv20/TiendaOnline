import express from "express";
import Producto from "../model/Producto.js";
const router = express.Router();

// Portada en /
router.get('/', async(req, res) => {
    try {
        const total = await Producto.countDocuments();

        // Elegimos 3 índices aleatorios
        const randomIndexes = Array.from({ length: 3 }, () =>
            Math.floor(Math.random() * total)
        );

        // Obtenemos los 3 productos usando el primer índice
        const productos = await Producto.find().skip(randomIndexes[0]).limit(3);

        res.render('portada.html', { productos }) // ../views/portada.html
    } catch (err) {
        console.error(err)
        res.status(500).send({ error: 'Error en el servidor' });
    }
});

export default router;