const fs = require('fs');
const file = 'C:/Users/Sanjivani/Desktop/krishi-share-frontend 2/krishi-share-frontend/src/pages/Mart/Orders.jsx';
let txt = fs.readFileSync(file, 'utf8');

const fnIndex = txt.indexOf('export default function Orders() {');
if (fnIndex === -1) {
    console.log("FN NOT FOUND");
    process.exit(1);
}

const searchStr = '<div className="flex-1">';
const matchIndex = txt.indexOf(searchStr);

if (matchIndex === -1) {
    console.log("NOT FOUND");
    process.exit(1);
}

const before = txt.substring(0, matchIndex);

const correctMiddle = `<div className="flex-1">
            <p className="text-xs font-bold text-primary-800">डिलिव्हरी बॉय निघाला आहे!</p>
            <p className="text-[10px] text-primary-600">अंदाजे १०-१५ मिनीटात पोहोचेल</p>
          </div>
        </div>
      )}
    </div>
  )
}

import OrderTrackingMap from '../../components/OrderTrackingMap'

`;

const after = txt.substring(fnIndex);

fs.writeFileSync(file, before + correctMiddle + after, 'utf8');
console.log('DONE');
