const { makeRedirectUri } = require('expo-auth-session');
console.log('Default:', makeRedirectUri({ scheme: 'financeapp' }));
console.log('With preferLocalhost:', makeRedirectUri({ scheme: 'financeapp', preferLocalhost: true }));
console.log('With useProxy:', makeRedirectUri({ scheme: 'financeapp', useProxy: true }));
