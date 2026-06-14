const fs = require('fs');

const files = [
  'src/components/purchase/AddPurchase.tsx',
  'src/components/sales/AddSales.tsx'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let content = fs.readFileSync(f, 'utf8');

  // Fix the parent grid container to prevent stretching and remove gaps in classic mode
  content = content.replace(
    /<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">/g,
    '<div className={cn("grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6", layoutMode === "classic" && "classic-summary-container flex items-stretch gap-0 mt-0 border-t border-b border-gray-300 bg-[#f1f5f9]")}>'
  );

  // Fix Remarks wrapper
  content = content.replace(
    /<div className="lg:col-span-1">/g,
    '<div className={cn("lg:col-span-1", layoutMode === "classic" && "remarks-section")}>'
  );

  // Fix Summary wrapper
  content = content.replace(
    /<div className="lg:col-span-3">/g,
    '<div className={cn("lg:col-span-3", layoutMode === "classic" && "classic-summary")}>'
  );

  // Make the inner summary grid a flex row in classic mode
  content = content.replace(
    /className=\{cn\(\s*"grid grid-cols-2 md:grid-cols-4 gap-4",\s*layoutMode === "classic" && "classic-summary"\s*\)\}/g,
    'className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", layoutMode === "classic" && "flex flex-nowrap w-max")}'
  );

  // Fix Final Amount block so it plays nice with flex row
  // Using string replace instead of regex to avoid escaping issues
  const finalAmountSearch1 = '<div className="md:col-span-2 lg:col-span-4 bg-primary/10 rounded-xl p-4 border border-primary/20 flex items-center justify-between yellow-block" style={{minWidth: "150px"}}>';
  const finalAmountReplace1 = '<div className={cn("md:col-span-2 lg:col-span-4 bg-primary/10 rounded-xl p-4 border border-primary/20 flex items-center justify-between", layoutMode === "classic" ? "yellow-block final-amount-block" : "")} style={{minWidth: "150px"}}>';
  content = content.split(finalAmountSearch1).join(finalAmountReplace1);

  const finalAmountSearch2 = '<div className="md:col-span-2 lg:col-span-4 bg-primary/10 rounded-xl p-4 border border-primary/20 flex items-center justify-between" style={{minWidth: "150px"}}>';
  const finalAmountReplace2 = '<div className={cn("md:col-span-2 lg:col-span-4 bg-primary/10 rounded-xl p-4 border border-primary/20 flex items-center justify-between", layoutMode === "classic" ? "yellow-block final-amount-block" : "")} style={{minWidth: "150px"}}>';
  content = content.split(finalAmountSearch2).join(finalAmountReplace2);

  const finalAmountSearch3 = '<div className="md:col-span-2 lg:col-span-4 bg-primary/10 rounded-xl p-4 border border-primary/20 flex items-center justify-between">';
  const finalAmountReplace3 = '<div className={cn("md:col-span-2 lg:col-span-4 bg-primary/10 rounded-xl p-4 border border-primary/20 flex items-center justify-between", layoutMode === "classic" ? "yellow-block final-amount-block" : "")}>';
  content = content.split(finalAmountSearch3).join(finalAmountReplace3);

  fs.writeFileSync(f, content);
}
console.log('Fixed AddPurchase layout');
