const { Pool } = require("pg");
require("dotenv").config();
const {
  POSTGRES_USER,
  POSTGRES_HOST,
  POSTGRES_DB,
  POSTGRES_PWD,
  POSTGRES_PORT,
} = process.env;
const conObj = {
  user: POSTGRES_USER,
  host: POSTGRES_HOST,
  database: POSTGRES_DB,
  password: POSTGRES_PWD,
  port: POSTGRES_PORT,
};
const pool = new Pool(conObj);

module.exports = function GetAccessToken(shop) {
  return (async () => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `select "token" from store_settings ss `
      );
      console.log("result", result);

      return {
        status: "success",
      };
    } finally {
      client.release();
    }
  })().catch((err) => {
    return {
      status: "error",
      msg: err.message,
    };
  });
};
