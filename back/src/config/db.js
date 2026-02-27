import dotenv from 'dotenv'
dotenv.config();
import {Pool} from 'pg'

// export a named pool so imports can destructure it
export const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    // correct spelling of the environment variable
    password: process.env.DB_PASSWORD
})

pool.on("connect", () => {
    console.log("Connected to the database");
})

pool.on("error", (err) => {
    console.log("Database error", err);
})
