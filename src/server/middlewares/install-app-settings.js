const adminApi = '2020-01';
const rp = require('request-promise');
module.exports = function InstallSettings(auth) {
    return new Promise((resolve,reject) => {
        const { shop, accessToken } = auth;
        const metafieldParam = {
            metafield: {
                namespace: 'arena',
                key: 'wl_cp_settings',
                value: JSON.stringify({
                    wishlist_settings: {
                        wishlist_enable: true,
                        wishlist_product_number: 2,  
                        wishlist_add_class: '.add-to-wishlist, .add-product-wishlist',
                        wishlist_show_class: '.show-wishlist',
                    },
                    compare_settings: {
                        compare_enable: true,
                        compare_product_number: 2,
                        compare_add_class: '.add-to-compare, .add-product-compare',
                        compare_show_class: '.show-compare',
                        compare_options: ['availability','options','vendor','collection','rating'],
                    }
                }),
                value_type: 'json_string',
            }
        }
        rp({
            uri: `https://${shop}/admin/api/${adminApi}/metafields.json`,
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-type': 'application/json; charset=utf-8'    
            },
            body: JSON.stringify(metafieldParam),
        })
        .then(response => {
            console.log('Task 2');
            console.log(response);
            resolve({
                status: 'success',
                msg: 'settings set',
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