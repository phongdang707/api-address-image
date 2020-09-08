const { Pool } = require('pg');

module.exports = class PostgresStrategy {
  constructor(config = {}) {
    this.pool = new Pool(config);
  }

  initialize() {
    const _this = this;
    (async () => {
      const client = await _this.pool.connect();
      try {
        const res = await client.query(`CREATE TABLE IF NOT EXISTS shops (
        id SERIAL,
        shopify_domain TEXT UNIQUE,
        access_token TEXT
      )`)
      } finally {
        client.release();
      }
    })().catch(e => console.log(e)); 
    return this;
  }

  storeShop({ shop, accessToken, data = {} }, done) {
    const _this = this;
    return (async () => {
      const client = await _this.pool.connect();
      try {
        const res = await client.query(`INSERT INTO shops (shopify_domain, access_token)
        SELECT '${shop}','${accessToken}' 
        WHERE NOT EXISTS
        (SELECT * FROM shops WHERE shopify_domain='${shop}')`)  
        // In case of cannot insert we'll update instead
        if(res.rowCount == 0) {
          const updateRes = await client.query(`UPDATE shops 
          SET access_token='${accessToken}' 
          WHERE shopify_domain='${shop}'`);
        }
        return { token: accessToken };
      } catch(err) {
        console.log(err);
      } 
      finally {
        client.release();
      }
    })().catch(e => console.log(e));
  }

  getShop({ shop }, done) {
    const _this = this;
    return (async () => {
      const client = await _this.pool.connect();
      try {
        const res = await client.query(`SELECT * FROM shops WHERE shopify_domain='${shop}'`)
        return { accessToken: res.rows[0].access_token };
      } finally {
        client.release();
      }
    })().catch(e => console.log(e));
  }
}