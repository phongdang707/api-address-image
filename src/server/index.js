// Koa
const Koa = require("koa");
// Koa Router
const Router = require("koa-router");
// Koa Session
const session = require("koa-session");
// Koa Ejs
const ejsRender = require("koa-ejs");
// Koa static cache
const staticCache = require("koa-static-cache");
// Koa Favicon
const favicon = require("koa-favicon");
// Koa body parser
const bodyParser = require("koa-bodyParser");
// Crypto
const crypto = require("crypto");

// Koa Shopify Authen
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import { receiveWebhook, registerWebhook } from "@shopify/koa-shopify-webhooks";
// Webpack
import webpack from "webpack";
import { devMiddleware, hotMiddleware } from "koa-webpack-middleware";
import devConfig from "../../webpack.config.js";
const compile = webpack(devConfig);
// Dotenv
require("dotenv").config();
// Enviroment Variables
const {
  SHOPIFY_APP_KEY,
  SHOPIFY_APP_HOST,
  SHOPIFY_APP_SECRET,
  SHOPIFY_APP_SCOPES,
  POSTGRES_USER,
  POSTGRES_HOST,
  POSTGRES_DB,
  POSTGRES_PWD,
  POSTGRES_PORT,
} = process.env;
// Postgresql connection config
const PG_CON_CONFIG = {
  user: POSTGRES_USER,
  password: POSTGRES_PWD,
  database: POSTGRES_DB,
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
};
// Knex of connect PG db
const knex = require("knex")({
  client: "pg",
  connection: PG_CON_CONFIG,
  useNullAsDefault: true,
});
// Postgres store for session
const sessStore = require("koa-session-knex-store")(knex, {
  createtable: false,
});
// Session's Config
const SESS_CONFIG = {
  httpOnly: true,
  maxAge: 2592000000, // 30 days
  store: sessStore, // Store on postgresql
  secure: true,
  sameSite: "none",
};

// Create Koa
const app = new Koa();
// Create Koa router
const router = new Router();
const webhook_router = new Router();

// Signed cookie key. Replace with App Secret
app.keys = ["koa_wishlist_app"];
// Create ejs render settings
ejsRender(app, {
  root: __dirname + "../../../views",
  layout: false,
  viewExt: "ejs",
  cache: false,
  debug: false,
  async: true,
});

// APP SPECIFIC MIDDLEWARES
const InitStoreSetting = require("./middlewares/init-store-setting");
const AppStatus = require("./middlewares/app-status");

// APP SPECIFIC ROUTES
const AdminApi = require("./routes/admin");
//const EvantoApi = require('./routes/evanto');

/**
 * ------------------------------------------Custom APP_UNINSTALLED webhook
 */
webhook_router.post("/webhooks/app/uninstall", bodyParser(), async (ctx) => {
  console.log("Uninstall webhook");
  const domain = ctx.request.headers["x-shopify-shop-domain"];
  const hmac = ctx.request.headers["x-shopify-hmac-sha256"];
  const topic = ctx.request.headers["x-shopify-topic"];
  const body = ctx.request.rawBody;
  const hash = crypto
    .createHmac("sha256", SHOPIFY_APP_SECRET)
    .update(body, "utf8", "hex")
    .digest("base64");

  if (hash === hmac) {
    ctx.status = 200;
    AppStatus.UpdateAppStatus(domain, {
      status: "uninstalled",
      install_date: null,
      uninstall_date: new Date(Date.now()).toISOString(),
    })
      .then((data) => {
        if (data.status == "success") {
          const UnsubscribeContact = require("./middlewares/unsubscribe-contact");
          const RemoveSession = require("./middlewares/remove-session");
          UnsubscribeContact(domain);
          RemoveSession(domain);
        }
      })
      .catch((err) => {
        console.log(err.message);
      });
  } else {
    ctx.status = 403;
    ctx.body = "Not sent from Shopify";
  }
});
/**
 * Webhook route here
 */
app.use(webhook_router.routes());
app.use(webhook_router.allowedMethods());
/**
 * End webhook route
 */
//------------------------------------------------------------------------------------------------------------

app.use(favicon(__dirname + "../../../public/favicon.ico"));
app.use(staticCache(__dirname + "../../../public", { maxAge: 0 }));
app.use(async (ctx, next) => {
  if (ctx.path.indexOf("/install") == -1) {
    return next();
  } else {
    await ctx.render("pages/install", {
      page_title: "Arena Theme Installation",
    });
  }
});
app.proxy = true;
app.use(session(SESS_CONFIG, app));
// app.use(devMiddleware(compile));
//app.use(hotMiddleware(compile));
app.use(
  createShopifyAuth({
    prefix: "/shopify",
    apiKey: SHOPIFY_APP_KEY,
    secret: SHOPIFY_APP_SECRET,
    scopes: [`${SHOPIFY_APP_SCOPES}`],
    accessMode: "offline",
    afterAuth(ctx) {
      const { shop, accessToken } = ctx.session;
      console.log("shop", shop);
      console.log("accessToken", accessToken);

      console.log("afterAuth");
      return (async () => {
        /**
         * INIT STORE SETTING IN DATABASE
         */
        const taskA = await InitStoreSetting({ shop, accessToken });

        /**
         * SUBSCRIBE CLIENT EMAIL
         */
        const SubscribeNewContact = require("./middlewares/subscribe-new-contact");
        if (taskA.status === "success" && taskA.subscribed) {
          SubscribeNewContact(taskA.contact, shop);
        }

        /**
         * INSTALL WEBHOOK WHEN CLIENT REMOVE APP
         */
        const taskB = registerWebhook({
          address: `${SHOPIFY_APP_HOST}/webhooks/app/uninstall`,
          topic: "APP_UNINSTALLED",
          apiVersion: "2019-10",
          accessToken,
          shop,
        });

        /**
         * INSTALL FRONTEND RESOURCES
         */
        const InstallFEResource = require("./middlewares/install-fe-resources");
        let taskC = await InstallFEResource({ shop, accessToken });

        // ctx.redirect('/')
      })().catch((err) => {
        console.log(err.message);
        console.log("Error when install resource at very first installation");
      });
    },
  })
);
// app.use(
//   verifyRequest({
//     authRoute: "shopify/auth",
//     fallbackRoute: "/install",
//   })
// );
app.use(router.routes());
app.use(router.allowedMethods());

router.get("/", async (ctx) => {
  const { shop, accessToken } = ctx.session;
  console.log(`shop: ${shop}`);
  console.log(`accessToken: ${accessToken}`);
  await ctx.render("pages/index", {
    page_title: "Shopify Node App",
    api_key: SHOPIFY_APP_KEY,
    shop: shop,
  });
});

// Admin type request handles
router.use("/admin", AdminApi.routes(), AdminApi.allowedMethods());

/*
// Evanto type request handles
router.use(
  '/evanto',
  EvantoApi.routes(),
  EvantoApi.allowedMethods()
)*/
app.listen(5000);
