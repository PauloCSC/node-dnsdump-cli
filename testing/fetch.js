const fetch = require ('node-fetch');
(async () => {
    try{
        const res = await fetch("https://api.hackertarget.com/reverseiplookup/?q=13.107.213.51", {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-language": "en-US,en;q=0.9",
                "x-api-quota": 51,
                "cache-control": "max-age=0",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "cross-site",
                "sec-fetch-user": "?1",
                // "sec-gpc": "1",
                // "upgrade-insecure-requests": "1",
                // "Referer": "https://dnsdumpster.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin",
            },
            "body": null,
            "method": "GET"
        });
        const data = await res.text();
        console.log(data);

    } catch (e) {
        console.log(e);
    }
})();
