import mongoose from 'mongoose';
import connectDB from './model/db.js';
import Producto from './model/Producto.js';
import fs from 'node:fs';

// Conectar con la BD
await connectDB();

// Leer JSON generado en la práctica anterior
const datos_productos = fs.readFileSync('datos_mercadona.json', 'utf8');
const lista_productos = JSON.parse(datos_productos);

// Guardar en la BD
await Guardar_en_modelo(Producto, lista_productos);

// Cerrar conexión
mongoose.connection.close();

async function Guardar_en_modelo(modelo, lista) {
    try {
        const insertados = await modelo.insertMany(lista);
        console.log(`Insertados ${insertados.length} documentos`);
    } catch (error) {
        console.error(`Error guardando lista: ${error.message}`);
    }
}