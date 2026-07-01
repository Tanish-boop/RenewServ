const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Change the greeting
content = content.replace(
  /Hello, \{currentUser\.profile\?\.name \|\| 'Customer'\}/,
  "Hello, {currentUser.name || 'Customer'}"
);

// 2. Remove the "Trust Building Features" section along with the buggy closing tags.
// Let's locate the start and end of this block.
const startStr = '{/* Trust Building Features */}';
const endStr = '{/* WHY CHOOSE RENEWSERV FEATURE GRID */}';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
  console.log('Removed Trust Building Features section.');
} else {
  console.error('Could not find Trust Building Features section.');
}

// 3. Insert the closing tags before the SERVICES tab
const servicesTabStr = '{/* ==================== TAB: SERVICES (BOOKINGS LIST) ==================== */}';
const servicesIndex = content.indexOf(servicesTabStr);

if (servicesIndex !== -1) {
  // We need to add the closing </div> and )} right before the services tab.
  // Let's see what is right before it. Typically some whitespace.
  content = content.substring(0, servicesIndex) + '</div>\n        )}\n\n        ' + content.substring(servicesIndex);
  console.log('Added closing tags before services tab.');
} else {
  console.error('Could not find Services Tab marker.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Dashboard clean up complete.');
