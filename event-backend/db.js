const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "Dior+2903",
  database: "postgres",
  port: 5432,
});

module.exports = pool;
