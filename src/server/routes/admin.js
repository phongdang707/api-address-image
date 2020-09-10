const Router = require("koa-router");
const AdminApi = new Router();
const bodyParser = require("koa-bodyparser");
const asyncBusboy = require("async-busboy");
const multer = require("@koa/multer");

const AppStatus = require("../middlewares/app-status");
const LoadAppSettings = require("../middlewares/load-app-settings");
const uploadMetafield = require("../middlewares/upload-metafield");
const GetAccessToken = require("../middlewares/get-access-token");

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

const upload = multer();
AdminApi.post(
  "/register",
  bodyParser(),
  upload.single("image"),
  async (ctx) => {
    const { accessToken } = ctx.session;

    let image = "";
    let originalname = "";

    const {
      shop,
      address,
      last_name,
      email,
      first_name,
      password,
      confirmPass,
    } = ctx.request.body;

    //Check file
    if (
      ctx.request.file &&
      (ctx.request.file.originalname || ctx.request.file.buffer)
    ) {
      image = ctx.request.file.buffer.toString("base64");
      originalname = ctx.request.file.originalname;
    }

    // Register Account
    const _data = await uploadMetafield(
      { accessToken },
      address,
      image,
      originalname,
      { last_name, email, first_name, password, confirmPass },
      shop
    );
    ctx.body = _data;
  }
);

module.exports = AdminApi;
