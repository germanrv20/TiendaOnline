// tienda.js 
import express from "express"
import nunjucks from "nunjucks"
import TiendaRouter from "./routes/router_tienda.js";
import connectDB from "./model/db.js"
import session from 'express-session';
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import UsuariosRouter from "./routes/router_usuarios.js";


import logger from './logger.js';
import ApiRouter from './routes/router_api.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';


// Conexión a MongoDB
// (Usamos el logger en lugar de console.log)
try {
    await connectDB();
    logger.info('Database connected successfully');
} catch (err) {
    logger.error(`Database connection error: ${err.message}`);
    process.exit(1);
}

const app = express()
const IN = process.env.IN || 'development'

//  MIDDLEWARES
// Decodificadores de Body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Gestor de Sesiones
app.use(session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false
}));

//  Middleware de "Carrito para Vistas"
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

//  Gestor de Cookies
app.use(cookieParser());


//  MIDDLEWARE DE AUTENTIFICACIÓN 
const autentificación = (req, res, next) => {
    const token = req.cookies.access_token;

    if (token) {
        try {
            const data = jwt.verify(token, process.env.SECRET_KEY);

            req.username = data.usuario; // Para los controladores
            req.admin = data.admin; // Para los controladores (API)
            app.locals.usuario = data.usuario; // Para las VISTAS
            app.locals.admin = data.admin; // Para las VISTAS

        } catch (err) {
            logger.warn(`Token JWT inválido o expirado: ${err.message}`);
            res.clearCookie("access_token");
            app.locals.usuario = undefined;
            req.admin = undefined;
            app.locals.admin = undefined;
        }
    } else {
        app.locals.usuario = undefined;
        req.admin = undefined;
        app.locals.admin = undefined;
    }
    next();
}
app.use(autentificación);



// (Configuración Nunjucks y filtro toFixed - Sin cambios)
const env = nunjucks.configure('views', {
    autoescape: true,
    noCache: IN === 'development',
    watch: IN === 'development',
    express: app
});
env.addFilter('toFixed', (num, digits) => {
    const number = parseFloat(num);
    if (isNaN(number)) {
        return num;
    }
    return number.toFixed(digits);
});


app.set('view engine', 'html')
app.use('/static', express.static('public'))

// (Rutas de test - Sin cambios)
app.get("/hola", (req, res) => {
    res.send('Hola desde el servidor');
});
app.get("/test", (req, res) => {
    res.render('test.html');
});

app.get("/busqueda", (req, res) => {
    res.render('busqueda_tailwind.html');
});

// SWAGGER SETUP 

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Tienda DAI',
            version: '1.0.0',
            description: 'API RESTful para gestionar los productos de la tienda',
        },
        servers: [{ url: `http://localhost:${process.env.PORT || 8000}` }],
        // Define la seguridad (para que Swagger sepa del token)
        components: {
            schemas: {
                Producto: {
                    type: "object",
                    properties: {
                        categoría: { type: "string" },
                        subcategoria: { type: "string" },
                        url_img: { type: "string" },
                        texto_1: { type: "string" },
                        texto_2: { type: "string" },
                        texto_precio: { type: "string" },
                        precio_euros: { type: "number" },
                        precio_rebajado: { type: "number" }
                    }
                }
            },
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'access_token' // El nombre de tu cookie
                }
            }
        }
    },
    // Le dice a swagger-jsdoc dónde encontrar los comentarios de la API
    apis: ['./routes/router_api.js'],
};
const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));



//  RUTAS PRINCIPALES 
app.use("/api", ApiRouter);
app.use("/usuarios", UsuariosRouter);
app.use("/", TiendaRouter);



const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    // Usamos el logger en lugar de console.log
    logger.info(`Servidor ejecutándose en http://localhost:${PORT}`);
    logger.info(`Documentación de API (Swagger) disponible en http://localhost:${PORT}/api-docs`);
})