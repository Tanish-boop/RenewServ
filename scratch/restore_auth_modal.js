const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The broken string around line 923-926:
const brokenStr = `            <button \n              onClick={handleCloseAuthModal}\n              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-5                {/* Tab Swappers */}`;

// Let's replace it with the correct JSX:
const correctStr = `            <button 
              onClick={handleCloseAuthModal}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>

            {regStep === 'details' ? (
              <>
                {/* Tab Swappers */}`;

if (content.includes(brokenStr)) {
  content = content.replace(brokenStr, correctStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Restored the auth modal structure successfully!');
} else {
  // Let's try matching with flexible whitespace/newlines
  console.log('Strict match failed. Trying flexible match...');
  const flexibleRegex = /<button\s+onClick=\{handleCloseAuthModal\}\s+className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-5\s+\{\/\* Tab Swappers \*\/\}/;
  if (flexibleRegex.test(content)) {
    content = content.replace(flexibleRegex, correctStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Restored the auth modal structure with flexible regex!');
  } else {
    console.error('Could not find the broken pattern in page.tsx.');
  }
}
