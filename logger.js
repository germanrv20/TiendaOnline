// logger.js
import winston from 'winston';

const logger = winston.createLogger({
    // Nivel de log: 'info' significa que registrará todo desde 'info'
    // (info, warn, error)
    level: 'info',

    // Formato de los logs
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),

    // Dónde guardar los logs (los "transportes")
    transports: [
        // Transporte 1: Guardar errores en un archivo
        new winston.transports.File({
            filename: 'error.log',
            level: 'error'
        }),
        // Transporte 2: Guardar todos los logs (info y superior)
        new winston.transports.File({ filename: 'combined.log' }),

        // Transporte 3: Mostrar logs en la consola
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(), // Añadir colores a la consola
                winston.format.simple()
            )
        })
    ],
});

export default logger;