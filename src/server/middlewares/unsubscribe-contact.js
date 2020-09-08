const rp = require('request-promise');
require('dotenv').config();
const {
    REMOTE_SERVER,
    APP_EMAIL,
  } = process.env;

module.exports = function UnsubscribeContact(shop) { 
    const remoteServer = REMOTE_SERVER;
    return (async () => {
        const options = {
            method: 'post',
            uri: `${remoteServer}/remote/unsubscribe-mail`,
            body: {
                address: APP_EMAIL, // Mailing list for this app
                product_name: 'Arena Wishlist Compare',
                product_type: 'app',
                product_version: '1.0',
                shop,
            },
            json: true
        };
        
        // Unsubscribe client when uninstall app 
        let unsubscribe_task = await rp(options)
                                    .catch(err => {
                                        throw new Error(err.message);
                                    });
        return unsubscribe_task;
    })()
    .catch(err => {
        return {
            status: 'error',
            msg: err.message,
        }
    })
}