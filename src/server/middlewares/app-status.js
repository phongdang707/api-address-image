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

module.exports = { 
    GetAppStatus: (shop) => {
        return (async () => {
            const client = await pool.connect();
            try {
                const status = await client.query(`SELECT store_plan, app_plan, status, install_date at time zone 'UTC' as install_date, uninstall_date at time zone 'UTC' as uninstall_date FROM store_settings
                WHERE store_name='${shop}'`);
                
                let install_date = status.rows[0].install_date ? status.rows[0].install_date : null;
                let uninstall_date = status.rows[0].uninstall_date ? status.rows[0].uninstall_date : null;
                
                return {
                    status: 'success',
                    step: 'Step --> After get app status',
                    app_status: status.rows[0].status,
                    install_date,
                    uninstall_date,
                    store_plan: status.rows[0].store_plan,
                    app_plan: status.rows[0].app_plan,
                }
            } finally {
              client.release();
            }
          })().catch(e => {
              return {
                  status: 'error',
                  step: 'Step --> When get app status',
                  msg: 'There is an unexpected error when getting app status'
              }
          });    
    },

    UpdateAppStatus: (shop, body) => { 
        
        return (async () => {
            const client = await pool.connect();
            
            // Handle query string
            let columns = [], values = [];
            let colStr = '', valStr = '';
            
            for(let key in body) {
                columns.push(key);
                values.push(body[key])
            }

            columns.map((col, index) => {
                if(index != columns.length - 1) {
                    colStr += `${col},`;
                    valStr += values[index] ? `'${values[index]}',` : `null,`;
                } else {
                    colStr += `${col}`;
                    valStr += values[index] ? `'${values[index]}'` : `null`;
                }
            })
            const queryStr = columns.length > 1 ? `UPDATE store_settings SET (${colStr}) = (${valStr}) WHERE store_name='${shop}'` : `UPDATE store_settings SET ${colStr} = ${valStr} WHERE store_name='${shop}'`;
            
            try {
                let update = await client.query(queryStr);
                
                return {
                    status: 'success',
                }
            } finally {
                client.release();
            }
            
          })().catch(e => {
              return {
                  status: 'error',
                  msg: e.message
              }
          });
    }
}