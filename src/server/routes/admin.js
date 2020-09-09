const Router = require("koa-router");
const AdminApi = new Router();
const bodyParser = require("koa-bodyparser");
const asyncBusboy = require("async-busboy");
const multer = require("@koa/multer");

const AppStatus = require("../middlewares/app-status");
const LoadAppSettings = require("../middlewares/load-app-settings");
const uploadMetafield = require("../middlewares/upload-metafield");

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
AdminApi.post("/test", bodyParser(), upload.single("image"), async (ctx) => {
  // const { shop, accessToken } = ctx.session;

  const shop = "phongdang707.myshopify.com";
  const accessToken = "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";

  const { address } = ctx.request.body;
  const { originalname } = ctx.request.file;

  const image = ctx.request.file.buffer.toString("base64");

  // console.log("encoded", encoded);
  console.log("originalname", originalname);

  const _data = await uploadMetafield(
    { shop, accessToken },
    address,
    image,
    originalname
  );
  ctx.body = _data;
});

module.exports = AdminApi;
