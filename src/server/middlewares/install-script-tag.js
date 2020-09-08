require('dotenv').config();
const adminApi = '2020-01';
const rp = require('request-promise');
const {
    SCRIPT_URL,    
} = process.env;

module.exports = function InstallScriptTag(auth) {
    const {shop,accessToken} = auth;
    return new Promise((resolve,reject) => {
        rp({
            uri: `https://${shop}/admin/api/${adminApi}/script_tags.json`,
            method: 'POST',
            headers: {
                "X-Shopify-Access-Token": accessToken,
                "Content-type": "application/json; charset=utf-8" 
            },
            body: JSON.stringify({
                script_tag: {
                    event: 'onload',
                    src: SCRIPT_URL,
                }
            })
        })
        .then((response) => {
            console.log('Task 1');
            console.log(response);
            resolve({
                status: 'success',
                msg: 'script tag installed',
            })
        })
        .catch(err => {
            resolve({
                status: 'error',
                msg: err.message,
            })
        })   
    })
}