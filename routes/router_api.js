// routes/router_api.js
import { Router } from 'express';
import Producto from '../model/Producto.js';
import logger from '../logger.js';

const router = Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Producto:
 *       type: object
 *       required:
 *         - texto_1
 *         - precio_euros
 *       properties:
 *         _id:
 *           type: string
 *           description: ID autogenerado por MongoDB
 *         categoría:
 *           type: string
 *         subcategoria:
 *           type: string
 *         url_img:
 *           type: string
 *         texto_1:
 *           type: string
 *           description: Nombre del producto
 *         texto_2:
 *           type: string
 *         texto_precio:
 *           type: string
 *         precio_euros:
 *           type: number
 *         precio_rebajado:
 *           type: number
 *       example:
 *         texto_1: "Aceite de oliva 0,4º"
 *         precio_euros: 5.50
 *         precio_rebajado: 4.99
 */

/**
 * @swagger
 * securitySchemes:
 *   cookieAuth:
 *     type: apiKey
 *     in: cookie
 *     name: access_token
 */


// --- Middleware de Autorización (Solo para la API) ---
const checkAdmin = (req, res, next) => {
    if (req.admin) {
        next(); // Es admin, puede continuar
    } else {
        logger.warn(`Intento de acceso no autorizado a API (Admin) por usuario: ${req.username || 'invitado'}`);
        res.status(403).json({ error: 'Acceso denegado. Se requiere permiso de administrador.' });
    }
};



/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtiene todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 */
router.get('/productos', async(req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (err) {
        logger.error(`Error GET /api/productos: ${err.message}`);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crea un nuevo producto (solo Admin)
 *     tags: [Productos]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Producto'
 *     responses:
 *       201:
 *         description: Producto creado correctamente
 *       403:
 *         description: Acceso denegado
 */

router.post('/productos', checkAdmin, async(req, res) => {
    try {
        const nuevoProducto = new Producto(req.body);
        await nuevoProducto.save();
        logger.info(`API: Producto creado por ${req.username}: ${nuevoProducto.texto_1}`);
        res.status(201).json(nuevoProducto);
    } catch (err) {
        logger.error(`Error POST /api/productos: ${err.message}`);
        res.status(400).json({ error: 'Datos de producto inválidos' });
    }
});

/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtiene un producto por su ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       404:
 *         description: Producto no encontrado
 */

router.get('/productos/:id', async(req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            logger.warn(`API: Producto no encontrado (GET): ${req.params.id}`);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(producto);
    } catch (err) {
        logger.error(`Error GET /api/productos/${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Modifica los precios de un producto (solo Admin)
 *     tags: [Productos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               precio_euros:
 *                 type: number
 *               precio_rebajado:
 *                 type: number
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente
 *       404:
 *         description: Producto no encontrado
 *       403:
 *         description: Acceso denegado (no admin)
 */

router.put('/productos/:id', checkAdmin, async(req, res) => {
    const { precio_euros, precio_rebajado } = req.body;

    if (precio_euros === undefined && precio_rebajado === undefined) {
        return res.status(400).json({ error: 'Se requiere "precio_euros" o "precio_rebajado" en el body.' });
    }

    try {
        const camposAActualizar = {};
        if (precio_euros !== undefined) camposAActualizar.precio_euros = precio_euros;
        if (precio_rebajado !== undefined) camposAActualizar.precio_rebajado = precio_rebajado;

        const producto = await Producto.findByIdAndUpdate(
            req.params.id, { $set: camposAActualizar }, { new: true, runValidators: true }
        );

        if (!producto) {
            logger.warn(`API: Producto no encontrado (PUT): ${req.params.id}`);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        logger.info(`API: Precio de producto ${producto.texto_1} modificado por ${req.username}`);
        res.json(producto);
    } catch (err) {
        logger.error(`Error PUT /api/productos/${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Elimina un producto (solo Admin)
 *     tags: [Productos]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *       404:
 *         description: Producto no encontrado
 *       403:
 *         description: Acceso denegado
 */

router.delete('/productos/:id', checkAdmin, async(req, res) => {
    try {
        const producto = await Producto.findByIdAndDelete(req.params.id);
        if (!producto) {
            logger.warn(`API: Producto no encontrado (DELETE): ${req.params.id}`);
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        logger.info(`API: Producto eliminado por ${req.username}: ${producto.texto_1}`);
        res.json({ mensaje: `Producto "${producto.texto_1}" eliminado correctamente` });
    } catch (err) {
        logger.error(`Error DELETE /api/productos/${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});



/**
 * @swagger
 * /api/busqueda-anticipada/{query}:
 * get:
 * summary: Busca productos que contengan el texto (Búsqueda anticipada)
 * tags: [Productos]
 * parameters:
 * - in: path
 * name: query
 * required: true
 * schema:
 * type: string
 * description: Texto a buscar (mínimo 3 caracteres)
 * responses:
 * 200:
 * description: Lista de productos encontrados
 */
// GET /api/busqueda-anticipada/:query
router.get('/busqueda-anticipada/:query', async(req, res) => {
    const query = req.params.query;

    if (!query || query.length < 3) {
        return res.status(400).json({ error: 'La búsqueda debe tener al menos 3 caracteres' });
    }

    try {
        // 1. LOG: Qué se busca
        logger.info(`API SEARCH: Buscando término: "${query}"`);

        const productos = await Producto.find({
            $or: [
                { texto_1: { $regex: query, $options: 'i' } },
                { texto_2: { $regex: query, $options: 'i' } },
                { categoría: { $regex: query, $options: 'i' } }
            ]
        }).limit(10);

        // 2. LOG: Cuántos resultados
        logger.info(`API SEARCH: Encontrados ${productos.length} resultados para "${query}"`);

        // 3. LOG: Qué devuelve exactamente (nombres de productos)
        if (productos.length > 0) {
            const nombres = productos.map(p => p.texto_1).join(', ');
            logger.info(`API SEARCH: Productos devueltos: [ ${nombres} ]`);
        } else {
            logger.info(`API SEARCH: No se encontraron coincidencias.`);
        }

        res.json(productos);
    } catch (err) {
        logger.error(`Error en búsqueda anticipada "${query}": ${err.message}`);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


export default router;