const fs = require('fs');
const filePath = 'src/pages/Dashboard/StoreOwnerDashboard.jsx';
if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

console.log('Total lines:', lines.length);

const start1 = 1129;
const end1 = 1164;
console.log('\n=== Lines 1130-1165 (BookingsTab start + ternary) ===');
for (let i = start1; i <= end1 && i < lines.length; i++) {
    console.log(String(i + 1).padStart(4) + ':', lines[i]);
}

const start2 = 1224;
const end2 = 1249;
console.log('\n=== Lines 1225-1250 (BookingsTab end) ===');
for (let i = start2; i <= end2 && i < lines.length; i++) {
    console.log(String(i + 1).padStart(4) + ':', lines[i]);
}
