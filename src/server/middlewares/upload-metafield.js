const apiVer = "2020-07";
const rp = require("request-promise");

module.exports = function uploadMetaField(auth, address, img, originalname) {
  const { shop, accessToken } = auth;

  if (!address || address == "") {
    return {
      status: "error",
      msg: "The address cannot be left blank",
    };
  }
  // else if (!img) {
  //   return {
  //     status: "error",
  //     msg: "Images cannot be left blank",
  //   };
  // }
  let themeMainId = "";

  const uriGetAllThem = `https://${shop}/admin/api/${apiVer}/themes.json`;
  const uriAssetTheme = `https://${shop}/admin/api/${apiVer}/themes/{theme_id}/assets.json`;
  const uriAddressMetaField = `https://${shop}/admin/api/${apiVer}/metafields.json`;

  return (async () => {
    /**
     * Check script tag to know app install at first or not
     */
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
        return {
          status: "error",
          msg: err.message,
        };
      });

    // Add MetaField For Address
    const addMetafield = await rp({
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
        // console.log("res", res);
      })
      .catch((err) => {
        return { status: "err", msg: err.message };
      });

    // Get Link Image From Asset
    if (themeMainId !== "") {
      // console.log(img);
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
          console.log("resp", res);
        })
        .catch((err) => {
          console.log("err========", err);
          return {
            status: "error",
            msg: err.message,
          };
        });
    }

    return {
      status: "success",
      msg: "Okay",
    };
  })().catch((err) => {
    return {
      status: "error",
      msg: err.message,
    };
  });

  // const uri = `https://${shop}/admin/api/${apiVer}/metafields.json`;

  // return new Promise((resolve, reject) => {
  //   rp({
  //     uri: uri,
  //     method: "POST",
  //     headers: {
  //       "X-Shopify-Access-Token": accessToken,
  //       "Content-type": "application/json; charset=utf-8",
  //     },
  //     body: JSON.stringify({
  //       metafield: {
  //         namespace: "inventory",
  //         key: "warehouse",
  //         value: 25,
  //         value_type: "integer",
  //       },
  //     }),
  //   })
  //     .then((response) => {
  //       console.log("Task 1");
  //       console.log(response);
  //       resolve({
  //         status: "success",
  //         msg: "script tag installed",
  //       });
  //     })
  //     .catch((err) => {
  //       resolve({
  //         status: "error",
  //         msg: err.message,
  //       });
  //     });
  // });
};
