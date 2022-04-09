const puppeteer = require('puppeteer');
const searchTextXPathFull = '/html/body/div[1]/div/section/div[1]/div[2]/div[1]/div/form/div[1]/div[2]/input[1]';
const searchSelector = '#regularInput';
const buttonSelector = '#formsubmit > button';

async function closePage(browser, page) {
    if (page.browserContextId !== undefined) {
        await browser._connection.send('Target.disposeBrowserContext', { browserContextId: page.browserContextId });
    }
    await page.close();
}



async function newPageWithNewContext(browser) {
    const { browserContextId } = await browser._connection.send('Target.createBrowserContext');
    const { targetId } = await browser._connection.send('Target.createTarget', { url: 'about:blank', browserContextId });
    let targetInfo = { targetId: targetId }
    const client = await browser._connection.createSession(targetInfo);
    const page = await browser.newPage({ context: 'another-context' }, client, browser._ignoreHTTPSErrors, browser._screenshotTaskQueue);
    page.browserContextId = browserContextId;
    return page;
}

(async function () {


    const browser = await puppeteer.launch({ headless: false });
    const page = await newPageWithNewContext(browser);

    await page.goto('https://dnsdumpster.com');

    const page2 = await newPageWithNewContext(browser);
    await page2.goto('https://dnsdumpster.com');

    await page.waitForXPath(searchTextXPathFull);
    let domain = 'ztrm99.com';
    try{
        await page.$eval(searchSelector, (element, domain) => {
            element.value = domain;
        }, domain);

    }catch (e){
        console.log(e);
    }
    domain = 'copeinca.com.pe';
    try{
        await page2.$eval(searchSelector, (element, domain) => {
            element.value = domain;
        }, domain);

    }catch (e){
        console.log(e);
    }

    try{
        await Promise.all([
            page.waitForNavigation({waitUntil: "domcontentloaded"}),
            page.click(buttonSelector),
            page2.waitForNavigation({waitUntil: "domcontentloaded"}),
            page2.click(buttonSelector)
        ]);
    } catch (e) {
        console.log(e)
    }


    // await closePage(browser, page);
    // await browser.close();

})();