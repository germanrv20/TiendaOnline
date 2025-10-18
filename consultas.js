import mongoose from 'mongoose'
import connectDB from './model/db.js'
import Producto from './model/Producto.js'

// Conexión a MongoDB
await connectDB()

// -------------------------------
// --Productos de menos de 1 €
// -------------------------------
const baratos = await Producto.find({ precio_euros: { $lt: 1 } })
console.log('\n ------Productos < 1 €:------------')
baratos.forEach(p => console.log(`- ${p.texto_1} (${p.precio_euros} €)`))

// -------------------------------
// ---Productos de menos de 1 € que no sean agua
// -------------------------------
const baratosNoAgua = await Producto.find({
    precio_euros: { $lt: 1 },
    texto_1: { $not: /agua/i }
})
console.log('\n ------Productos < 1 € (sin agua):-------')
baratosNoAgua.forEach(p => console.log(`- ${p.texto_1} (${p.precio_euros} €)`))

// -------------------------------
// ----Aceites ordenados por precio
// -------------------------------
const aceites = await Producto.find({ subcategoria: /Aceite/i })
    .sort({ precio_euros: 1 })

console.log('\n--- Aceites ordenados por precio ---')
aceites.forEach(a =>
    console.log(`- ${a.texto_1} (${a.texto_2}): ${a.precio_euros} €`)
)


// -------------------------------
// --------Productos en garrafa
// -------------------------------
const garrafas = await Producto.find({ texto_2: /garrafa/i })
console.log('\n -----Productos en garrafa:---------')
garrafas.forEach(p => console.log(`- ${p.texto_1}`))

// Cerrar conexión
mongoose.connection.close()