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
  address,
  img,
  originalname,
  data,
  shop
) {
  let { accessToken } = auth;
  const { last_name, email, first_name, password, confirmPass } = data;

  if (!address || address.toString() == "") {
    return {
      status: "error",
      msg: "The address cannot be empty",
    };
  } else if (!originalname || !img) {
    return {
      status: "error",
      msg: "No files selected",
    };
  }

  let themeMainId = "";
  let urlImage = "";

  let MetaFieldAddress;
  let MetaFieldImage;

  const uriGetAllThem = `https://${shop}/admin/api/${apiVer}/themes.json`;
  const uriAddressMetaField = `https://${shop}/admin/api/${apiVer}/metafields.json`;
  const uirRegister = `https://${shop}/admin/api/${apiVer}/customers.json`;

  return (async () => {
    let errors;
    const client = await pool.connect();

    const token = await client.query(
      `SELECT * FROM store_settings WHERE store_name='${shop}'`
    );
    accessToken = token.rows[0].token;

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

    // Add MetaField For Address
    const addMetafieldAddress = await rp({
      uri: uriAddressMetaField,
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        metafield: {
          namespace: "address",
          key: "address",
          value: `${address}`,
          value_type: "string",
        },
      }),
    })
      .then((res) => {
        console.log("res", res);
        MetaFieldAddress = res;
      })
      .catch((err) => {
        // console.log("err2", err);
        return { status: "err", msg: err.message };
      });

    // Get Link Image From Asset
    if (themeMainId !== "") {
      const getLinkImageFromAsset = await rp({
        uri: `https://${shop}/admin/api/${apiVer}/themes/${themeMainId}/assets.json`,
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-type": "application/json; charset=utf-8",
        },
        body: {
          asset: {
            key: `assets/${originalname}`,
            attachment: `${img}`,
          },
        },
        json: true,
      })
        .then((res) => {
          console.log("res", res);
          return (urlImage = res.asset.public_url);
        })
        .catch((err) => {
          // console.log("err2", err);
          return {
            status: "error",
            msg: err.message,
          };
        });
    }

    // Add Metafield For Image
    const addMetafieldImage = await rp({
      uri: uriAddressMetaField,
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        metafield: {
          namespace: "image",
          key: "image",
          value: `${urlImage}`,
          value_type: "string",
        },
      }),
    })
      .then((res) => {
        MetaFieldImage = res;
      })
      .catch((err) => {
        // console.log("err4", err);
        return { status: "err", msg: err.message };
      });

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
              namespace: "address",
              key: "address",
              value: `${address}`,
              value_type: "string",
            },
            {
              namespace: "image",
              key: "image",
              value: `${urlImage}`,
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
