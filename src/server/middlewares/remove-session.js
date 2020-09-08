const { Pool } = require('pg');
require('dotenv').config();
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
  port: POSTGRES_PORT
};
const pool = new Pool(conObj);

module.exports = function RemoveSession(domain) { 
    return (async () => {
        const client = await pool.connect();
        try {           
            // Delete session match with domain.
            const result = await client.query(`DELETE FROM session
            WHERE sess->>'shop'='${domain}'`);
            
            return {
                status: 'success',
            }
        } finally {
          client.release();
        }
    })()
    .catch(err => {
        return {
            status: 'error',
            msg: err.message,
        }
    })
}