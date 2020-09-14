const Router = require("koa-router");
const AdminApi = new Router();
const bodyParser = require("koa-bodyparser");
const asyncBusboy = require("async-busboy");
const multer = require("@koa/multer");

const AppStatus = require("../middlewares/app-status");
const LoadAppSettings = require("../middlewares/load-app-settings");
const uploadMetafield = require("../middlewares/upload-metafield");
const GetAccessToken = require("../middlewares/get-access-token");
const UpdateMetaField = require("../middlewares/update-customer");

const upload = multer();

/**
 * ROUTE FOR HANDLE APP STATUS================================================================
 */

AdminApi.get("/app-status", async (ctx) => {
  const { shop } = ctx.session;
  const _data = await AppStatus.GetAppStatus(shop);
  ctx.body = _data;
});

AdminApi.post("/app-status", bodyParser(), async (ctx) => {
  const { shop } = ctx.session;
  const bodyData = ctx.request.body;
  const _data = await AppStatus.UpdateAppStatus(shop, bodyData);
  ctx.body = _data;
});

/**
 * ============================================================================================
 */

/**
 * ROUTE FOR HANDLE CHECK STORE URL WITH IT'S SESSION==========================================
 */
AdminApi.post("/check-store", bodyParser(), async (ctx) => {
  const { shop } = ctx.session;
  const { parentUrl } = ctx.request.body;
  ctx.body = {
    status: "success",
    valid: shop == parentUrl,
  };
});
/**
 * ============================================================================================
 */

AdminApi.get("/load-app-settings", async (ctx) => {
  const { shop, accessToken } = ctx.session;
  const _data = await LoadAppSettings({ shop, accessToken });
  ctx.body = _data;
});

/**
 * ============================================================================================
 */

/**
 * ROUTE FOR REGISTER CUSTOMER==========================================
 */

AdminApi.post(
  "/register",
  bodyParser(),
  upload.fields([
    {
      name: "passport",
      maxCount: 1,
    },
    {
      name: "proofOfAddress",
      maxCount: 2,
    },
  ]),
  async (ctx) => {
    const { accessToken } = ctx.session;

    let originalNamePassport = "";
    let originalNameProofOfAddress = "";
    let passport = "";
    let proofOfAddress = "";

    const {
      shop,
      last_name,
      email,
      first_name,
      password,
      confirmPass,
    } = ctx.request.body;

    //Check file
    if (ctx.files) {
      originalNamePassport = ctx.files.passport[0].originalname;
      passport = ctx.files.passport[0].buffer.toString("base64");

      originalNameProofOfAddress = ctx.files.proofOfAddress[0].originalname;
      proofOfAddress = ctx.files.proofOfAddress[0].buffer.toString("base64");

      // image = ctx.request.file.buffer.toString("base64");
      // originalname = ctx.request.file.originalname;
    }

    // Register Account
    const _data = await uploadMetafield(
      { accessToken },
      { originalNamePassport, passport },
      { originalNameProofOfAddress, proofOfAddress },
      { last_name, email, first_name, password, confirmPass },
      shop
    );
    ctx.body = _data;
  }
);

/**
 * ============================================================================================
 */
/**
 * ROUTE FOR REGISTER CUSTOMER==========================================
 */

AdminApi.put(
  "/update-customer/:id",
  bodyParser(),
  upload.fields([
    {
      name: "passport",
      maxCount: 1,
    },
    {
      name: "proofOfAddress",
      maxCount: 1,
    },
  ]),
  async (ctx) => {
    console.log("VAO UPDATE");
    const { shop } = ctx.request.body;
    let customer_id = ctx.params.id;

    let originalNamePassport = "";
    let originalNameProofOfAddress = "";
    let passport = "";
    let proofOfAddress = "";

    //Check file
    if (ctx.files.passport) {
      originalNamePassport = ctx.files.passport[0].originalname;
      passport = ctx.files.passport[0].buffer.toString("base64");
    } else {
      originalNamePassport = "";
      passport = "";
    }
    if (ctx.files.proofOfAddress) {
      originalNameProofOfAddress = ctx.files.proofOfAddress[0].originalname;
      proofOfAddress = ctx.files.proofOfAddress[0].buffer.toString("base64");
    } else {
      originalNameProofOfAddress = "";
      proofOfAddress = "";
    }

    // Udpate Account
    const _data = await UpdateMetaField(
      { originalNamePassport, passport },
      { originalNameProofOfAddress, proofOfAddress },
      { shop, customer_id }
    );
    ctx.body = _data;
  }
);

module.exports = AdminApi;
