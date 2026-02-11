const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "votre_mot_de_passe",
  database: "event_manager",
  port: 5432,
});

module.exports = pool;
