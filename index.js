const {getAll} = require('./dnsdumpster');
const puppeteer = require("puppeteer");
let results = ['ztrm99.com','copeinca.com.pe'];

async function closePage(browser, page) {
    if (page.browserContextId !== undefined) {
        await browser._connection.send('Target.disposeBrowserContext', { browserContextId: page.browserContextId });
    }
    await page.close();
}

async function newPageWithNewContext(browser) {
    const { browserContextId } = await browser._connection.send('Target.createBrowserContext');
    const { targetId } = await browser._connection.send('Target.createTarget', { url: 'about:blank', browserContextId });
    let targetInfo = { targetId: targetId };
    const client = await browser._connection.createSession(targetInfo);
    const page = await browser.newPage({ context: 'another-context' }, client, browser._ignoreHTTPSErrors, browser._screenshotTaskQueue);
    page.browserContextId = browserContextId;
    return page;
}


(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const BATCH_SIZE = 2;
    let arrPage = [];
    for (let i=0;i<BATCH_SIZE;i++){
        let temp = await newPageWithNewContext(browser);
        arrPage.push(temp);
    }
    while (results.length > 0) {
        let toProcess = results.slice(0, BATCH_SIZE);
        // for (const page of arrPage) {
        //     const num = arrPage.indexOf(page);
        //     await getAll(toProcess[num],'dev',browser,page);
        // }
        console.log("processing", toProcess);
        const resultsprom = await Promise.all(
            toProcess.map((dominio) => {
                newPageWithNewContext(browser).then(page => {
                    getAll(dominio, 'dev', browser, page);
                });

                // closePage(brow, page);
            })
        );
        resultsprom.forEach((e) => {
            console.log(e);
        });
        results = results.slice(BATCH_SIZE);
    }
    console.log("Termino");
    await browser.close();
})();