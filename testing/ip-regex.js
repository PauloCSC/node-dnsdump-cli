const ipRegex = require('ip-regex');

// Contains an IP address?
ipRegex().test('unicorn 192.168.0.1');
//=> true

// Is an IP address?
ipRegex({exact: true}).test('unicorn 192.168.0.1');
//=> false

ipRegex.v6({exact: true}).test('1:2:3:4:5:6:7:8');
//=> true

let a = 'v=spf1 ip4:190.119.225.62 ip4:192.168.10.12312310 ip4:190.119.225.34 ip4:52.226.130.176 ip4:190.81.33.168 include:spf.protection.outlook.com -all'.match(ipRegex.v4());
//=> ['192.168.0.1', '1:2:3:4:5:6:7:8']
// console.log(a);
// a.forEach(e => {
//     console.log(ipRegex({includeBoundaries: true}).test(e));
// })
// Contains an IP address?
ipRegex({includeBoundaries: true}).test('192.168.0.2000000000');
//=> false

// Matches an IP address?
'192.168.0.2000000000'.match(ipRegex({includeBoundaries: true}));
//=> null
// let re = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/gi;
// let b = 'v=spf1 ip4:190.119.225.62 ip4:192.168.10.12312310 ip4:190.119.225.34 ip4:52.226.130.176 ip4:190.81.33.168 include:spf.protection.outlook.com -all';
// let c = 'google-site-verification=QyuTvEJSyGlNEj48YL6uHUhIDXQxnEUZnasw2Zs79EI\\009';
// let myArray = c.match(re);
// console.log(myArray);


function getAllIPs (s) {
    const re = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/gi;
    return s.match(re); // returns null if no ip found
}

console.log(getAllIPs("v=spf1 ip4:190.119.225.62 ip4:190.119.225.34 ip4:52.226.130.176 ip4:190.81.33.168 include:spf.protection.outlook.com -all"))