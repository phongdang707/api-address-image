const apiVer = '2020-01';
const rp = require('request-promise');

module.exports = function LoadAppSettings(auth) {
    const { shop, accessToken } = auth;
    const uri = `https://${shop}/admin/api/${apiVer}/metafields.json?namespace=arena&key=wl_cp_settings`;
    
    return (async () => {
        let req = await rp({
            uri,
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-type': 'application/json; charset=utf-8'    
            },
        })
        .catch(err => {
            throw new Error(err.message);
        });

        return {
            status: 'success',
            settings: JSON.parse(req).metafields,
        }
    })()
    .catch(err => {
        return {
            status: 'error',
            msg: err.message,
        }
    })
}