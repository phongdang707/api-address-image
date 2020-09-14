const apiVer = "2020-07";
const rp = require("request-promise");
const axios = require("axios");

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

module.exports = function UpdateMetaField(
  passportFull,
  proofOfAddressFull,
  data
) {
  let { shop, customer_id } = data;
  let { originalNamePassport, passport } = passportFull;
  let { originalNameProofOfAddress, proofOfAddress } = proofOfAddressFull;

  let urlPassport;
  let urlProofOfAddress;
  let themeMainId = "";
  let idMetaFieldPassPort;
  let idMetaFieldProofOfAddress;

  // URL
  let uriUpdateCustomer = `https://${shop}/admin/api/${apiVer}/customers/${customer_id}.json`;
  let uriGetAllThem = `https://${shop}/admin/api/${apiVer}/themes.json`;

  return (async () => {
    let errors;

    // Connect DB
    const client = await pool.connect();
    const token = await client.query(
      `SELECT * FROM store_settings WHERE store_name='${shop}'`
    );
    console.log("token", token);
    accessToken = token.rows[0].token;

    // Get Theme ID
    const getThemId = await rp({
      uri: uriGetAllThem,
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    })
      .then((result) => {
        const rlt = JSON.parse(result);
        rlt.themes.forEach((element) => {
          if (element.role == "main") {
            return (themeMainId = element.id);
          }
        });
      })
      .catch((err) => {
        return {
          status: "error",
          msg: err.message,
        };
      });

    // Get Link proofOfAddress
    const getLinkProofOfAddress = await rp({
      uri: `https://${shop}/admin/api/${apiVer}/themes/${themeMainId}/assets.json`,
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-type": "application/json; charset=utf-8",
      },
      body: {
        asset: {
          key: `assets/${originalNameProofOfAddress}`,
          attachment: `${proofOfAddress}`,
        },
      },
      json: true,
    })
      .then((res) => {
        return (urlProofOfAddress = res.asset.public_url);
      })
      .catch((err) => {
        return {
          status: "error",
          msg: err.message,
        };
      });

    // Get Link Passport
    const getLinkPassport = await rp({
      uri: `https://${shop}/admin/api/${apiVer}/themes/${themeMainId}/assets.json`,
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-type": "application/json; charset=utf-8",
      },
      body: {
        asset: {
          key: `assets/${originalNamePassport}`,
          attachment: `${passport}`,
        },
      },
      json: true,
    })
      .then((res) => {
        console.log("result Passport", res);
        return (urlPassport = res.asset.public_url);
      })
      .catch((err) => {
        console.log("err", err);
        return {
          status: "error",
          msg: err.message,
        };
      });

    // console.log("originalNameProofOfAddress", originalNameProofOfAddress);
    // console.log("proofOfAddress", proofOfAddress);

    console.log("urlProofOfAddress", urlProofOfAddress);
    console.log("urlPassport", urlPassport);

    const getMetaFieldForCustomer = await rp({
      uri: `https://${shop}/admin/customers/${customer_id}/metafields.json`,
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-type": "application/json; charset=utf-8",
      },
    })
      .then((res) => {
        let obj = JSON.parse(res);
        for (let i = 0; i < obj.metafields.length; i++) {
          const element = obj.metafields[i];
          if (element.key == "passport") {
            idMetaFieldPassPort = element.id;
          }
          if (element.key == "proofOfAddress") {
            idMetaFieldProofOfAddress = element.id;
          }
        }
      })
      .catch((err) => {
        console.log("err", err);
        return {
          status: "error",
          msg: err.message,
        };
      });

    // Update
    if (originalNamePassport != "") {
      const updateCusomter = await rp({
        uri: `https://${shop}/admin/api/${apiVer}/metafields/${idMetaFieldPassPort}.json`,
        // uri: `https://${shop}/admin/customers/4008939356313/metafields.json`,
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: {
          metafield: {
            id: idMetaFieldPassPort,
            value: `${urlPassport}`,
            value_type: "string",
          },
        },
        json: true,
      })
        .then((result) => {
          console.log("result=====================", result);
        })
        .catch((err) => {
          console.log("err===========================sad", err);
          return {
            status: "error",
            msg: err.message,
          };
        });
    }

    if (originalNameProofOfAddress != "") {
      const updateCusomter = await rp({
        uri: `https://${shop}/admin/api/${apiVer}/metafields/${idMetaFieldProofOfAddress}.json`,
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: {
          metafield: {
            id: idMetaFieldProofOfAddress,
            value: `${urlProofOfAddress}`,
            value_type: "string",
          },
        },
        json: true,
      })
        .then((result) => {
          console.log("result=====================", result);
        })
        .catch((err) => {
          console.log("err===========================sad", err);
          return {
            status: "error",
            msg: err.message,
          };
        });
    }

    if (errors) {
      return {
        status: "err",
        msg: errors,
      };
    } else {
      return {
        status: "success",
        msg: "Okay",
      };
    }
  })().catch((err) => {
    return {
      status: "error",
      msg: err.message,
    };
  });
};
