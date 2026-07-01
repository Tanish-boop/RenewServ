const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The banner text
const bannerHtml = `
      {/* Top Banner */}
      <div className="bg-slate-900 text-white text-[10px] md:text-xs font-bold text-center py-2 px-4 shadow-sm w-full z-50">
        ⚡ Solar Panel Cleaning, Health Checks & Reinstallation in Pune & PCMC. Book at just ₹99!
      </div>
`;

if (!content.includes('Pune & PCMC. Book at just ₹99!')) {
  content = content.replace(
    /(\{\/\* Desktop Header \*\/)/,
    bannerHtml + '\n      $1'
  );
}

const getSection = (start, end) => {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);
  if (startIndex !== -1 && endIndex !== -1) {
    return content.substring(startIndex, endIndex);
  }
  return null;
};

const whyChoose = getSection('{/* WHY CHOOSE RENEWSERV FEATURE GRID */}', '{/* REAL RESULTS BEFORE/AFTER DISPLAY */}');
const realResults = getSection('{/* REAL RESULTS BEFORE/AFTER DISPLAY */}', '{/* WHAT OUR CUSTOMERS SAY */}');
const customers = getSection('{/* WHAT OUR CUSTOMERS SAY */}', '{/* Service Selection Cards */}');
const services = getSection('{/* Service Selection Cards */}', '{/* Support Direct Assistance */}');
const support = getSection('{/* Support Direct Assistance */}', '{/* Trust Building Features */}');
const trust = getSection('{/* Trust Building Features */}', '{/* ==================== TAB: SERVICES (BOOKINGS LIST) ==================== */}');

if (whyChoose && realResults && customers && services && support && trust) {
  // We need to cut out the "          </div>\n        )}\n\n        " from the end of trust.
  const trustActual = trust.replace(/\s*<\/div>\s*\}\)\s*$/, '');
  const endingTabs = trust.substring(trustActual.length);

  let newWhyChoose = whyChoose.replace(/p-4/g, 'p-2')
                              .replace(/w-10 h-10/g, 'w-8 h-8')
                              .replace(/text-lg/g, 'text-sm')
                              .replace(/text-xs/g, 'text-[10px]')
                              .replace(/text-\[10px\]/g, 'text-[9px]');

  let newRealResults = realResults.replace(/\/dirty_panels\.png/, '/clean_solar_panels_1782736684270.png')
                                  .replace('☁ Before', '✨ Clean Panels')
                                  .replace(/\/clean_panels\.png/, '/panel_reinstallation_1782737582682.png')
                                  .replace('✨ After Renewserv', '🔧 Maintenance / Reinstallation');

  const newOrder = 
    services +
    support +
    trustActual + '\n\n' +
    newWhyChoose +
    newRealResults +
    customers +
    endingTabs;

  const originalBlock = whyChoose + realResults + customers + services + support + trust;
  content = content.replace(originalBlock, newOrder);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Reordered dashboard successfully.');
} else {
  console.log('Missing sections');
}
