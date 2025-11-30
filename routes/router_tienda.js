import express from "express";
import Producto from "../model/Producto.js";
const router = express.Router();
import logger from '../logger.js';

// Portada en /
router.get('/', async(req, res) => {
    try {
        const query = req.query.q || ''; // Obtener la búsqueda


        // Recoge el error de autenticación de la URL, si existe
        const error = req.query.error || null;


        const total = await Producto.countDocuments();
        let productos;

        if (query) {
            logger.info(`busqueda de  ${req.query.q} en la portada`);
            // (Lógica de búsqueda...)
            productos = await Producto.find({
                $or: [
                    { texto_1: { $regex: query, $options: 'i' } },
                    { texto_2: { $regex: query, $options: 'i' } },
                    { categoría: { $regex: query, $options: 'i' } },
                    { subcategoria: { $regex: query, $options: 'i' } }
                ]
            }).limit(20);
        } else {
            // (Lógica de productos aleatorios...)
            const randomIndexes = Array.from({ length: 15 }, () =>
                Math.floor(Math.random() * total)
            );
            productos = [];
            for (let i = 0; i < randomIndexes.length; i++) {
                const prod = await Producto.find().skip(randomIndexes[i]).limit(1);
                if (prod.length > 0) productos.push(prod[0]);
            }
        }

        logger.info(`Renderizando ${productos.length} productos para la portada`);


        // Pasamos la variable 'error' a la plantilla
        res.render('portada.html', { productos, query, error });

    } catch (err) {
        console.error(err)
        res.status(500).send({ error: 'Error en el servidor' });
    }
});

// Pasamos 'next' para usarlo en el error de req.session.save
router.get('/al_carrito/:id', async(req, res, next) => {
    try {


        if (!req.username) {
            // Si no hay usuario logueado (req.username viene del middleware de tienda.js)

            // Obtenemos la URL de la que venía el usuario
            const referer = req.get('referer') || '/';

            // Usamos el objeto URL para añadir el parámetro de forma segura
            const url = new URL(referer, `http://${req.headers.host}`);
            url.searchParams.set('error', 'auth'); // error=auth

            return res.redirect(url.pathname + url.search);
        }


        // Si el usuario SÍ está logueado
        const id = req.params.id;
        const producto = await Producto.findById(id);

        if (!producto) {
            logger.warn(`Intento de añadir al carrito producto no encontrado: ${id}`);
            return res.redirect('/'); // O mostrar un error
        }

        if (!req.session.carrito) {
            req.session.carrito = {
                productos: {},
                total_items: 0,
                precio_total: 0
            };
        }

        let carrito = req.session.carrito;
        const precio = producto.precio_rebajado > 0 ? producto.precio_rebajado : producto.precio_euros;

        if (carrito.productos[id]) {
            carrito.productos[id].cantidad++;
        } else {
            carrito.productos[id] = {
                nombre: producto.texto_1,
                cantidad: 1,
                precio_unitario: precio
            };
        }

        let total_items = 0;
        let precio_total = 0;
        for (const prodId in carrito.productos) {
            const item = carrito.productos[prodId];
            total_items += item.cantidad;
            precio_total += (item.cantidad * item.precio_unitario);
        }

        carrito.total_items = total_items;
        carrito.precio_total = precio_total;

        // Guardamos la sesión antes de redirigir
        req.session.save((err) => {
            if (err) {
                logger.error(`Error guardando la sesión: ${err.message}`);
                return next(err); // Pasamos el error al manejador de errores
            }
            // Redirigimos solo cuando la sesión está guardada
            logger.info(`Usuario ${req.username} añadió al carrito: ${producto.texto_1}`);
            res.redirect(req.get('referer') || '/');
        });

    } catch (err) {
        logger.error(`Error en GET /al_carrito/${req.params.id}: ${err.message}`);
        res.status(500).send({ error: 'Error añadiendo al carrito' });
    }
});

export default router;