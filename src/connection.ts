import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Pool } = pg;

// Creating a new Connection Pool
const pool = new Pool({
  // The process.env sections are accessing the private information in the .env file
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: "localhost",
  database: process.env.DB_NAME,
  // 5432 is the default port for postgreSQL
  port: 5432,
});

const connectToDb = async () => {
  try {
    await pool.connect();
  } catch (err) {
    console.error("Error connecting to database:", err);
    process.exit(1);
  }
};

export { pool, connectToDb };
