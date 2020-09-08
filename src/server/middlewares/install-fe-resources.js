const adminApi = '2020-01';
const rp = require('request-promise');

module.exports = function InstallFEResource(auth) {
    const { shop, accessToken } = auth;
    return (async () => {
        /**
         * Check script tag to know app install at first or not
         */
        const checkScriptTag = await rp({
            uri: `https://${shop}/admin/api/${adminApi}/script_tags.json`,
            method: 'GET',
            headers: {
                "X-Shopify-Access-Token": accessToken,
            }	
        })
        .catch(err => {
            return {
                status: 'error',
                msg: err.message,
            }
        });

        if(typeof checkScriptTag === 'object' && checkScriptTag.status === 'error') {
            return checkScriptTag;
        }

        const scriptList = JSON.parse(checkScriptTag).script_tags;
        let installFlag = true;

        if(scriptList.length) {
            const scriptIndex = scriptList.findIndex(script => script.src.search('arn__wishlist-compare') !== -1);
            
            if(scriptIndex !== -1) {
                installFlag = false;    
            }
        }
        /**
         * -----------------------------------------------------------------------------------------------
         */
        if(installFlag) {
            const InstallScriptTag = require('./install-script-tag');
            const InstallSettings = require('./install-app-settings');
            // Batch Install #1
            const batch_1 = await Promise.all([InstallScriptTag(auth), InstallSettings(auth)]);
            console.log(batch_1);
        } 

        return {
            status: 'success',
            msg: 'Okay',
        }

    })()
    .catch((err) => {
        return {
            status: 'error',
            msg: err.message,
        }
    })
}
