const fs = require('fs');

const files = [
  'src/components/report/sales/SalesSummary.tsx',
  'src/components/report/sales/SalesRegister.tsx',
  'src/components/report/sales/AreaWise.tsx',
  'src/components/report/sales/SalesmanWise.tsx',
  'src/components/report/purchase/PurchaseSummary.tsx',
  'src/components/report/purchase/PurchaseRegister.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Replace Filter Card wrapper with clean wrapper
  content = content.replace(
    /<Card className="overflow-hidden">\s*<CardContent className="p-1">\s*<div className="flex flex-col gap-4 p-1">/g,
    '<div className="bg-white dark:bg-gray-900 border rounded-none p-2">\n              <div className="flex flex-col gap-2">'
  );

  content = content.replace(
    /<\/div>\s*<\/CardContent>\s*<\/Card>/g,
    '</div>\n            </div>'
  );

  // Remove the border-t and large gap from grid
  content = content.replace(
    /<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">/g,
    '<div className="flex flex-wrap items-end gap-3 pt-2">'
  );

  // For AreaWise / SalesmanWise, it might be grid-cols-2 or something else
  content = content.replace(
    /<div className="grid grid-cols-1 md:grid-cols-[^"]+ gap-4 pt-4 border-t">/g,
    '<div className="flex flex-wrap items-end gap-3 pt-2">'
  );
  
  content = content.replace(
    /<div className="grid grid-cols-1 md:grid-cols-[^"]+ gap-4">/g,
    '<div className="flex flex-wrap items-end gap-3 pt-2">'
  );

  // Fix Labels: change to small uppercase
  content = content.replace(
    /<Label className="text-sm font-medium">/g,
    '<Label className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 block">'
  );

  // Fix Input spaces and sizes
  content = content.replace(
    /<div className="space-y-2">/g,
    '<div className="flex-1 min-w-[150px] max-w-[200px]">'
  );

  // Change input height
  content = content.replace(
    /<Input\s+placeholder=/g,
    '<Input className="h-8 text-xs rounded-sm" placeholder='
  );

  // If there's an existing className on Input, add h-8 text-xs
  content = content.replace(
    /className="pl-10"/g,
    'className="pl-8 h-8 text-xs rounded-sm"'
  );
  
  // Combobox Button
  content = content.replace(
    /className="w-full justify-between"/g,
    'className="w-full justify-between h-8 text-xs rounded-sm px-2"'
  );

  fs.writeFileSync(file, content);
}
console.log('Filters patched');
