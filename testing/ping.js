// const ping = require("ping");
//
// (async function () {
//     const result = await ping.promise.probe('www.kindacode.com', {
//         timeout: 10,
//         extra: ["-i", "2"],
//     });
//
//     console.log(result.numeric_host);
// })();

const ping = require("ping");

function isArray (ar) {
    return ar instanceof Array
        || Array.isArray(ar)
        || (ar && ar !== Object.prototype && isArray(ar.__proto__));
}

(async (hosts) => {
    const ping = require('ping');
    const cfg = {
        timeout: 5,
        // WARNING: -i 2 may not work in other platform like windows
        extra: ['-i', '2'],
    };
    let result = null;
    if (!isArray(hosts)) {
        result = await ping.promise.probe(hosts, cfg);
        console.log([{host: hosts, ip: result.numeric_host}]);
    } else {
        result = [];
        for (const host of hosts) {
            const {numeric_host} = await ping.promise.probe(host, cfg);
            result.push({host,ip:numeric_host});
        }
        console.log(result);
    }
})('vault.ztrm99.com');

