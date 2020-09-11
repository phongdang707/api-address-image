const apiVer = "2020-07";
const rp = require("request-promise");

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

  let themeMainId = "";

  // console.log("customer_id", customer_id);
  // console.log("shop", shop);
  // console.log("passport", passport);
  // console.log("originalNamePassport", originalNamePassport);
  // console.log("proofOfAddress", proofOfAddress);
  // console.log("originalNameProofOfAddress", originalNameProofOfAddress);

  // UR
  let uriUpdateCustomer = `https://${shop}/admin/api/${apiVer}/customers/${customer_id}.json`;
  let uriGetAllThem = `https://${shop}/admin/api/${apiVer}/themes.json`;

  var body;

  const getLink = (buffer, originalName) => {
    let url;
    rp({
      uri: `https://${shop}/admin/api/${apiVer}/themes/${themeMainId}/assets.json`,
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-type": "application/json; charset=utf-8",
      },
      body: {
        asset: {
          key: `assets/${originalName}`,
          attachment: `${buffer}`,
        },
      },
      json: true,
    })
      .then((res) => {
        console.log("url", url);
        return (url = res.asset.public_url);
      })
      .catch((err) => {
        // console.log("err2", err);
        return {
          status: "error",
          msg: err.message,
        };
      });
  };

  return (async () => {
    let errors;

    // Connect DB
    const client = await pool.connect();
    const token = await client.query(
      `SELECT * FROM store_settings WHERE store_name='${shop}'`
    );
    accessToken = token.rows[0].token;

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

    if (originalNamePassport && passport) {
      if (
        originalNamePassport &&
        passport &&
        proofOfAddress &&
        originalNameProofOfAddress
      ) {
        getLink(originalNamePassport, passport);
        return body;
      }
      return console.log("passport");
    } else if (proofOfAddress && originalNameProofOfAddress) {
      if (
        originalNamePassport &&
        passport &&
        proofOfAddress &&
        originalNameProofOfAddress
      ) {
        return console.log("full");
      }
      return console.log("proofOfAddress");
    }

    // const getLinkPassportFromAsset = await rp({
    //   uri: `https://${shop}/admin/api/${apiVer}/themes/${themeMainId}/assets.json`,
    //   method: "PUT",
    //   headers: {
    //     "X-Shopify-Access-Token": accessToken,
    //     "Content-type": "application/json; charset=utf-8",
    //   },
    //   body: body,
    //   json: true,
    // })
    //   .then((res) => {
    //     console.log("res", res);
    //     return (urlPassport = res.asset.public_url);
    //   })
    //   .catch((err) => {
    //     // console.log("err2", err);
    //     return {
    //       status: "error",
    //       msg: err.message,
    //     };
    //   });

    // Check Errors
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
