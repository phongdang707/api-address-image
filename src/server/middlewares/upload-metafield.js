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

module.exports = function uploadMetaField(
  auth,
  passportFull,
  proofOfAddressFull,
  data,
  shop
) {
  let { accessToken } = auth;
  let { last_name, email, first_name, password, confirmPass } = data;
  let { originalNamePassport, passport } = passportFull;
  let { originalNameProofOfAddress, proofOfAddress } = proofOfAddressFull;

  let themeMainId = "";
  let urlImage = "";
  let urlPassport = "";
  let urlProofOfAddress = "";

  let MetaFieldAddress;
  let MetaFieldImage;
  let MetaFieldPassport;
  let MetaFieldProofOfAddress;

  // UR
  let uriGetAllThem = `https://${shop}/admin/api/${apiVer}/themes.json`;
  let uriAddressMetaField = `https://${shop}/admin/api/${apiVer}/metafields.json`;
  let uirRegister = `https://${shop}/admin/api/${apiVer}/customers.json`;

  return (async () => {
    let errors;

    // Connect DB
    const client = await pool.connect();
    const token = await client.query(
      `SELECT * FROM store_settings WHERE store_name='${shop}'`
    );
    console.log("token", token);
    accessToken = token.rows[0].token;
    console.log("accessToken", accessToken);

    // Get Theme Id
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
        // console.log("err1", err);
        return {
          status: "error",
          msg: err.message,
        };
      });

    // Get Link
    if (themeMainId !== "") {
      // Get Link Assets Passport
      const getLinkPassportFromAsset = await rp({
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
          console.log("res", res);
          return (urlPassport = res.asset.public_url);
        })
        .catch((err) => {
          // console.log("err2", err);
          return {
            status: "error",
            msg: err.message,
          };
        });

      // Get Link Assets ProofOfAddress
      const getLinkProofOfAddressFromAsset = await rp({
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
          console.log("res", res);
          return (urlProofOfAddress = res.asset.public_url);
        })
        .catch((err) => {
          // console.log("err2", err);
          return {
            status: "error",
            msg: err.message,
          };
        });
    }

    // // Add Metafield For Passport
    // const addMetafieldPassport = await rp({
    //   uri: uriAddressMetaField,
    //   method: "POST",
    //   headers: {
    //     "X-Shopify-Access-Token": accessToken,
    //     "Content-type": "application/json; charset=utf-8",
    //   },
    //   body: JSON.stringify({
    //     metafield: {
    //       namespace: "passport",
    //       key: "passport",
    //       value: `${urlPassport}`,
    //       value_type: "string",
    //     },
    //   }),
    // })
    //   .then((res) => {
    //     console.log("res", res);
    //     MetaFieldPassport = res;
    //     console.log("MetaFieldPassport", MetaFieldPassport);
    //   })
    //   .catch((err) => {
    //     return { status: "err", msg: err.message };
    //   });

    // // Add Metafield For ProofOfAddress
    // const addMetafieldProofOfAdress = await rp({
    //   uri: uriAddressMetaField,
    //   method: "POST",
    //   headers: {
    //     "X-Shopify-Access-Token": accessToken,
    //     "Content-type": "application/json; charset=utf-8",
    //   },
    //   body: JSON.stringify({
    //     metafield: {
    //       namespace: "proofOfAddress",
    //       key: "proofOfAddress",
    //       value: `${urlProofOfAddress}`,
    //       value_type: "string",
    //     },
    //   }),
    // })
    //   .then((res) => {
    //     console.log("res", res);
    //     MetaFieldProofOfAddress = res;
    //     console.log("MetaFieldProofOfAddress", MetaFieldProofOfAddress);
    //   })
    //   .catch((err) => {
    //     return { status: "err", msg: err.message };
    //   });

    const RegisterCustomer = await rp({
      uri: uirRegister,
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        customer: {
          first_name: first_name,
          last_name: last_name,
          email: email,
          password: password,
          password_confirmation: confirmPass,
          metafields: [
            {
              namespace: "passport",
              key: "passport",
              value: `${urlPassport}`,
              value_type: "string",
            },
            {
              namespace: "proofOfAddress",
              key: "proofOfAddress",
              value: `${urlProofOfAddress}`,
              value_type: "string",
            },
          ],
        },
      }),
    })
      .then((res) => {})
      .catch((err) => {
        errors = err;
        return { status: "err", msg: err };
      });

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
