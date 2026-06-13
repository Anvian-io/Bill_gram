const fs = require('fs');

const files = [
  'src/components/purchase/AddPurchase.tsx',
  'src/components/sales/AddSales.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // We want to add 'grey-block' or 'yellow-block' to the summary div wrappers based on the content
  // Gross Amount -> grey
  content = content.replace(
    /<div className="bg-summary-bg-1 rounded-lg p-3 border border-summary-border-1">/g,
    '<div className="bg-summary-bg-1 rounded-lg p-3 border border-summary-border-1 grey-block">'
  );

  // Box/Unit -> yellow
  content = content.replace(
    /<div className="bg-summary-bg-2 rounded-lg p-3 border border-summary-border-2">/g,
    '<div className="bg-summary-bg-2 rounded-lg p-3 border border-summary-border-2 yellow-block">'
  );

  // CESS/INS -> yellow
  content = content.replace(
    /<div className="bg-summary-bg-3 rounded-lg p-3 border border-summary-border-3">/g,
    '<div className="bg-summary-bg-3 rounded-lg p-3 border border-summary-border-3 yellow-block">'
  );

  // Scheme 1 -> grey
  content = content.replace(
    /<div className="bg-summary-bg-4 rounded-lg p-3 border border-summary-border-4">/g,
    '<div className="bg-summary-bg-4 rounded-lg p-3 border border-summary-border-4 grey-block">'
  );

  // Discount -> yellow
  content = content.replace(
    /<div className="bg-summary-bg-5 rounded-lg p-3 border border-summary-border-5">/g,
    '<div className="bg-summary-bg-5 rounded-lg p-3 border border-summary-border-5 yellow-block">'
  );

  // Tax -> grey
  content = content.replace(
    /<div className="bg-summary-bg-6 rounded-lg p-3 border border-summary-border-6">/g,
    '<div className="bg-summary-bg-6 rounded-lg p-3 border border-summary-border-6 grey-block">'
  );
  
  // Amount (Add) -> yellow (Actually let's just make sure all default divs that are 'rounded-lg p-3 border' get yellow-block or grey-block)
  
  // Total / Final Amount -> yellow-block
  content = content.replace(
    /<div className="md:col-span-2 lg:col-span-4 bg-primary\/10 rounded-xl p-4 border border-primary\/20 flex items-center justify-between">/g,
    '<div className="md:col-span-2 lg:col-span-4 bg-primary/10 rounded-xl p-4 border border-primary/20 flex items-center justify-between yellow-block" style={{minWidth: "150px"}}>'
  );

  // There are some others like "Amount (Add)" and "Credit Amount" which don't have bg-summary-bg-X
  // Let's just do a regex replace on any summary block div that doesn't have a color block yet
  // This is too fragile with regex. Let's just write a more robust replace script or use multi_replace.
  
  fs.writeFileSync(file, content);
}

console.log('Patched summary blocks');
