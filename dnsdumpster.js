'use strict';
// const yargs = require('yargs/yargs')(process.argv.slice(2));
const puppeteer = require('puppeteer');
const ora = require('ora');
const pino = require('pino');
const pretty = require('pino-pretty');
const colorette = require("colorette");
const loggerFile = pino();
let logger = pino(pretty({
	ignore: 'pid,hostname,time',
	colorize: colorette.isColorSupported,
	destination: 1,
	levelFirst: true,
	// translateTime: true
}));

const URL = 'https://dnsdumpster.com/';
const searchTextXPathFull = '/html/body/div[1]/div/section/div[1]/div[2]/div[1]/div/form/div[1]/div[2]/input[1]';
const searchSelector = '#regularInput';
const buttonSelector = '#formsubmit > button';

const DNSServersSelector = '#intro > div:nth-child(1) > div.row > div > div:nth-child(8) > table > tbody > tr';
const MXRecordsSelector = '#intro > div:nth-child(1) > div.row > div > div:nth-child(10) > table > tbody > tr';
const TXTRecordsSelector = '#intro > div:nth-child(1) > div.row > div > div:nth-child(12) > table > tbody > tr';
const HostRecordsSelector = '#intro > div:nth-child(1) > div.row > div > div:nth-child(14) > table > tbody > tr';
let DNSServers = [];
let MXRecords = [];
let TXTRecords = [];
let IPsinTXTRecords = [];
let HostRecords = [];

// const domain = null;
let page = null;
let browser = null;
let context = null;
let spinner = null;
// let ENV = "prod";
let verbosity = null;
let takeScreenshot = false;
// const argv = yargs
// 	.usage("This a tool for search DNS Servers, MX Records and Host Records ")
// 	.options({
// 		'd': {
// 			alias: 'domain',
// 			demandOption: true,
// 			default: 'google.com',
// 			describe: 'Domain to search records',
// 			type: 'string'
// 		}
// 	})
// 	.argv
// ;
const optionsPuppeteer = {
	headless: false,
	args: [
		'--incognito',
		'--no-sandbox',
		'--disable-web-security',
		'--allow-running-insecure-content',
		// '--window-size=1920,1080',
		'--disable-gpu',
		'--ignore-certificate-errors',
		'--disable-gpu-sandbox',
		'single-process'
	]
}

function delay(t, val) {
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve(val);
		}, t);
	});
}

function isArray (ar) {
	return ar instanceof Array
		|| Array.isArray(ar)
		|| (ar && ar !== Object.prototype && isArray(ar.__proto__));
}

async function pingHost (hosts) {
	const ping = require('ping');
	const cfg = {
		timeout: 5,
		// WARNING: -i 2 may not work in other platform like windows
		extra: ['-i', '2'],
	};
	let result = null;
	if (!isArray(hosts)) {
		result = await ping.promise.probe(hosts, cfg);
		return [{host: hosts, ip: result.numeric_host}];
	} else {
		result = [];
		for (const host of hosts) {
			const {numeric_host} = await ping.promise.probe(host, cfg);
			result.push({host,ip:numeric_host});
		}
	}
}

function startSpinner(message){
	spinner = ora(message).start();
}

async function handleError(message, e){
	spinner.fail(message).clear();
	logger.fatal(message + '\n' + e.toString());
	// await context.close();
	return;
}

async function closePage(browser, page) {
	if (page.browserContextId !== undefined) {
		await browser._connection.send('Target.disposeBrowserContext', { browserContextId: page.browserContextId });
	}
	await page.close();
}

function showVerbosity(verbosity){
	switch (verbosity) {
		case 0: //nothing show -- prod
			console.log = function () { };
			spinner = ora({text:'prod message',isSilent:true});
			startSpinner = function () { };
			// ignoring all fields
			logger = pino(pretty({
				ignore: 'pid,hostname,time,msg,level',
				messageKey: 'pid' //default msg
			}));
			takeScreenshot = true;
			break;
		case 1: //only show spinners -- dev
			console.log = function () { };
			// ignoring all fields
			logger = pino(pretty({
				ignore: 'pid,hostname,time,msg,level',
				messageKey: 'pid' //default msg
			}));
			break;
		case 2: //only show logger -- other
			spinner = ora({text:'prod message',isSilent:true});
			startSpinner = function () { };
			takeScreenshot = true;
			break;
	}
}

async function getDataTable (SelectorTable) {
	return await page.$$eval(SelectorTable, rows => {
		return Array.from(rows, row => {
			let columns = null;
			try{
				columns = row.querySelectorAll('td');
			}catch {
				columns = row.querySelectorAll('tr');
			}
			return Array.from(columns, column => column.innerText.trim());
		});
	});
}

function getAllIPs (s) {
	const re = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/gi;
	return s.match(re); // returns null if no ip found
}

async function compareHostvsIP (host,ip) {
	let res = await pingHost(host);
	return (res[0].ip === ip) ;
}

async function checkBrowser() {
	startSpinner("Checking Browser");
	if (!browser) {
		spinner.warn().clear();
		startSpinner("Creating Browser");
		try{
			browser = await puppeteer.launch(optionsPuppeteer);
			spinner.succeed('Browser Opened').clear();
			logger.info('Browser Opened');
		}catch (e) {
			await handleError('Browser could\'nt be opened', e);
		}
		return browser;
	}
	startSpinner("Browser already exists");
	spinner.succeed('Browser already exists').clear();
	logger.info('Browser already exists');
}

async function getAll (domain, ENV, brow, page)  {
	// browser = brow;
	if (ENV === 'prod') {
		verbosity = 0;
	} else if (ENV === 'dev'){
		verbosity = 1;
	} else {
		verbosity = 2;
	}
	showVerbosity(verbosity);
	await delay(1000);
	// try {
	// 	// launch browser with the plugin
	// 	// await checkBrowser();
	// 	console.log(browser);
	// 	startSpinner("Opening Context");
	// 	context = await browser.createIncognitoBrowserContext();
	// 	page = await context.newPage();
	// 	spinner.succeed('Context Opened').clear();
	// 	logger.info('Context Opened');
	// } catch (e) {
	// 	await handleError('Context could\'nt be opened', e);
	// }

	startSpinner("Browsing to DNSDumpster.com - "+domain);
	try {
		await delay(1000);
		// navigate to the target page
		await page.goto(URL);
		spinner.succeed('Browsed to DNSDumpster.com - '+domain).clear();
		logger.info('Browsed to DNSDumpster.com');
	} catch (e) {
		await handleError('error while loading the page',e);
	}

	// disable navigation timeout errors
	await page.setDefaultNavigationTimeout(0);

	await page.waitForXPath(searchTextXPathFull);

	startSpinner("Setting domain "+domain);
	try{
		await page.$eval(searchSelector, (element, domain) => {
			element.value = domain;
		}, domain);
		spinner.succeed("Domain Setted "+domain).clear();
		logger.info("Domain Setted "+domain);
	}catch (e){
		await handleError('Error during setting domain',e);
	}
	startSpinner("Request info of "+domain);
	try{
		await Promise.all([
			page.waitForNavigation({waitUntil: "domcontentloaded"}),
			page.click(buttonSelector)
		]);
		spinner.succeed("Successfully requested").clear();
		logger.info("Successfully requested");
	} catch (e) {
		await handleError('Request failed',e);
	}
	if (takeScreenshot){
		startSpinner("Taking screenshot");
		try {
			await page.screenshot({path: `${domain}-screenshot.png`, fullPage: true});
			spinner.succeed(`Screenshot saved: ${domain}-screenshot.png`).clear();
			logger.info(`Screenshot saved: ${domain}-screenshot.png`);
		} catch (e) {
			await handleError('Screenshot failed', e);
		}
	}
	startSpinner("Retrieving DNS Servers");
	try{
		const dataDNS = await getDataTable(DNSServersSelector);
		if (dataDNS.length === 0) { spinner.warn("Zero DNS Servers retrieved").clear(); logger.warn("Zero DNS Servers retrieved <!>");}
		else {
			spinner.succeed(`${dataDNS.length} DNS Servers retrieved`).clear();
			logger.info("DNS Servers retrieved:");
			console.log("host","ip","country");
			dataDNS.forEach(e => {
				console.log(e[0], e[1].split("\n")[0], e[2].split("\n")[1]);
				DNSServers.push({name:e[0], ip:e[1].split("\n")[0], country:e[2].split("\n")[1]});
			});
		}
	} catch (e) {
		await handleError('Failed when trying to obtain the DNS Servers',e);
	}
	startSpinner("Retrieving MX Records");
	try{
		const dataMX = await getDataTable(MXRecordsSelector);
		if (dataMX.length === 0) { spinner.warn("Zero TXT Records retrieved").clear(); logger.warn("Zero TXT Records retrieved <!>");}
		else {
			spinner.succeed(`${dataMX.length} MX Records retrieved`).clear();
			logger.info("MX Records retrieved:");
			dataMX.forEach(e => {
				console.log(e[0].split(" ")[1], e[1].split("\n")[0], e[1].split("\n")[1], e[2].split("\n")[1]);
				MXRecords.push({record:e[0].split(" ")[1], ip:e[1].split("\n")[0], resolve:e[1].split("\n")[1], country:e[2].split("\n")[1]});
			});
		}
	} catch (e) {
		await handleError('Failed when trying to obtain the MX Records',e);
	}
	startSpinner("Retrieving TXT Records");
	try{
		const dataTXT = await getDataTable(TXTRecordsSelector);
		if (dataTXT.length === 0) { spinner.warn("Zero TXT Records retrieved").clear(); logger.warn("Zero TXT Records retrieved <!>");}
		else{
			spinner.succeed(`${dataTXT.length} TXT Records retrieved`).clear();
			logger.info("TXT Records retrieved:");
			dataTXT.forEach(e => {
				console.log(e[0].slice(1, -1));
				TXTRecords.push({txtrecord:e[0].slice(1, -1)});
			});
			TXTRecords.forEach(e => {
				let res = getAllIPs(e.txtrecord);
				if (!(res === null)) { res.forEach(e => IPsinTXTRecords.push(e)); }
			});
		}
	} catch (e) {
		await handleError('Failed when trying to obtain the TXT Records',e);
	}
	startSpinner("Retrieving Host Records");
	try {
		const dataHosts = await getDataTable(HostRecordsSelector);
		if (dataHosts.length === 0) { spinner.warn("Zero Hosts retrieved").clear(); logger.warn("Zero Hosts retrieved <!>");}
		else {
			spinner.succeed(`${dataHosts.length} Hosts Records retrieved`).clear();
			logger.info("Hosts Records retrieved:");
			console.log("host","ip","sameresolve","provider","country");
			for (const e of dataHosts) {
				const sameresolve = await compareHostvsIP(e[0].split("\n")[0],e[1]);
				console.log(e[0].split("\n")[0], e[1].split("\n")[0], sameresolve, e[2].split("\n")[0], e[2].split("\n")[1]);
				HostRecords.push({
					host:e[0].split("\n")[0],
					ip:e[1].split("\n")[0],
					sameresolve,
					provider:e[2].split("\n")[0],
					country:e[2].split("\n")[1]
				});
			}
			console.table(HostRecords);
		}
	}catch (e) {
		await handleError("Failed when trying to obtain the Host Records",e)
	}
	// await context.close();
	return {DNSServers,MXRecords,TXTRecords,HostRecords};
};

module.exports = {
	getAll, checkBrowser, closePage, optionsPuppeteer
};