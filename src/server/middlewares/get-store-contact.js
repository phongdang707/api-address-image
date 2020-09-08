const rp = require('request-promise');
const apiVer = '2019-10';

module.exports = function GetStoreContact(data) { 
    const { shop, accessToken } = data;
    // plan name enum: trial, affiliate, basic, professional, unlimited, enterprise.
    return (async () => {
        let storeData = await rp({
            uri: `https://${shop}/admin/api/${apiVer}/shop.json?fields=email,customer_email,plan_name`,
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-type': 'application/json; charset=utf-8'    
            },
        })
        .catch(err => {
            return { status: 'error', msg: err.message } 
        });

        if(typeof storeData === 'object' && storeData.status === 'error') {
            throw new Error(storeData.msg);
        } else {
            storeData = JSON.parse(storeData)['shop'];
            const { email, customer_email, plan_name } = storeData;
            return {
                status: 'success',
                email,
                customer_email,
                plan_name,
            }
        }
    })()
    .catch(err => {
        return {
            status: 'error',
            msg: err.message,
        }
    })
}