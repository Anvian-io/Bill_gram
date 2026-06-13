const fs = require('fs');

const files = [
  'src/components/report/sales/SalesSummary.tsx',
  'src/components/report/sales/SalesRegister.tsx',
  'src/components/report/sales/AreaWise.tsx',
  'src/components/report/sales/SalesmanWise.tsx',
  'src/components/report/purchase/PurchaseSummary.tsx',
  'src/components/report/purchase/PurchaseRegister.tsx'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let content = fs.readFileSync(f, 'utf8');
  
  // The bad regex replaced `</div></CardContent></Card>` with `</div></div>` globally.
  // The table section's opening is `<Card className="mb-6 overflow-hidden"> <CardContent className="p-0">`
  // And ends with `</Table> </div> </div> </motion.div>` due to the bad replacement.
  
  content = content.replace(
    /<\/Table>\s*<\/div>\s*<\/div>\s*<\/motion.div>/g,
    '</Table>\n              </div>\n            </CardContent>\n          </Card>\n        </motion.div>'
  );
  
  fs.writeFileSync(f, content);
}
console.log('Fixed tags');
