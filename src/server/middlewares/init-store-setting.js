const { Pool } = require("pg");
const GetStoreContact = require("./get-store-contact");
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

module.exports = function InitStoreSetting(auth) {
  const { shop, accessToken } = auth;
  console.log("accessToken", accessToken);
  return (async () => {
    // Get Contact Info
    let contact = await GetStoreContact({ shop, accessToken });

    const client = await pool.connect();
    try {
      let subscribed = false;

      // Insert store setting information for first installing.
      const result = await client.query(`INSERT INTO store_settings (store_name, store_plan, status, install_date, contact, token)
      SELECT '${shop}', '${contact.plan_name}', 'installed', null, '${contact.email}', '${accessToken}'
      WHERE NOT EXISTS
      (SELECT * FROM store_settings WHERE store_name='${shop}')`);

      // If rowCount is zero there are 2 cases:
      //  - App has already installed on store ==> not update status
      //  - App record still in db but its status is uninstalled and merchant re-install again
      //      ==> need update status
      if (!result.rowCount) {
        let update = await client.query(`UPDATE store_settings SET (store_plan, status, install_date, uninstall_date, contact , token) = ('${contact.plan_name}', 'installed', null, null, '${contact.email}', ${accessToken})
        WHERE store_name='${shop}' AND status='uninstalled'`);
        console.log("update============================", update);
        if (update.rowCount) {
          subscribed = true;
        }
      } else {
        subscribed = true;
      }

      return {
        status: "success",
        msg: "Init store setting to db successfully",
        contact,
        subscribed,
      };
    } finally {
      client.release();
    }
  })().catch((err) => {
    console.log(err.message);
  });
};
