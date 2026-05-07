const fs = require('fs');
const file = 'C:/Users/Sanjivani/Desktop/krishi-share-frontend 2/krishi-share-frontend/src/pages/Mart/Orders.jsx';
let txt = fs.readFileSync(file, 'utf8');
console.log('Length:', txt.length);
console.log('Fn Index:', txt.indexOf('export default function Orders() {'));
console.log('Flex 1:', txt.indexOf('<div className="flex-1">'));
console.log('Delivery:', txt.indexOf('डिलिव्हरी बॉय निघाला आहे!'));
