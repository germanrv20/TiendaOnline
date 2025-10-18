// ./model/db.js
import mongoose from "mongoose";


const USER_DB = process.env.USER_DB;
const PASS = process.env.PASS;
const DB_NAME = 'DAI';

const url = `mongodb://${USER_DB}:${PASS}@localhost:27017/${DB_NAME}?authSource=admin`;

export default async function connectDB() {
    try {
        await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(` Database connected: ${url}`);
    } catch (err) {
        console.error(` Error connecting to DB: ${err.message}`);
        process.exit(1);
    }

    const dbConnection = mongoose.connection;
    dbConnection.on("error", (err) => {
        console.error(`Connection error: ${err}`);
    });
}