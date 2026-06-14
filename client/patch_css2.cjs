const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const classicSummaryReplacement = `
.classic-mode .classic-summary-container {
  display: flex;
  align-items: stretch;
  border-top: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
  background-color: #f1f5f9;
  width: 100%;
}
.classic-mode .remarks-section {
  flex: 0 0 200px;
  padding: 8px;
  border-right: 1px solid #cbd5e1;
  background-color: #f1f5f9;
}
.classic-summary {
  display: flex;
  flex-wrap: nowrap;
  flex: 1;
  overflow-x: auto;
}
.classic-mode .classic-summary > div {
  background: #f1f5f9 !important;
  border: none !important;
  border-right: 1px solid #cbd5e1 !important;
  padding: 4px 8px !important;
  flex: 1 1 0;
  min-width: 90px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border-radius: 0 !important;
  box-shadow: none !important;
}
.classic-mode .classic-summary > div:last-child {
  border-right: none !important;
}
.classic-mode .classic-summary > div.yellow-block {
  background-color: #fef08a !important;
}
.classic-mode .classic-summary > div.grey-block {
  background-color: #f1f5f9 !important;
}
.classic-mode .classic-summary span.text-xs,
.classic-mode .classic-summary label,
.classic-mode .classic-summary p.text-sm {
  font-size: 10px !important;
  font-weight: 700;
  color: #1e293b !important;
  margin-bottom: 4px;
  text-transform: uppercase;
  display: block;
}
.classic-mode .classic-summary input {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  height: auto !important;
  padding: 0 !important;
  color: #0f172a !important;
  font-weight: 600;
  font-size: 13px !important;
  text-align: left;
}
.classic-mode .classic-summary input:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
.classic-mode .classic-summary svg {
  display: none !important;
}
/* Specific fix for final amount */
.classic-mode .classic-summary .final-amount-block {
  background-color: #fde047 !important; /* Slightly darker yellow */
  justify-content: center;
  align-items: center;
  min-width: 120px;
}
.classic-mode .classic-summary .final-amount-block input,
.classic-mode .classic-summary .final-amount-block p.text-2xl {
  font-size: 16px !important;
  font-weight: 800 !important;
  text-align: center;
  width: 100%;
}
.classic-mode .classic-summary .final-amount-block p.text-\\[10px\\] {
  display: none !important;
}
`;

css = css.replace(/\.classic-summary \{[\s\S]*?\.classic-mode \.classic-summary svg \{[\s\S]*?\}/, '');
css = css.replace(/\.classic-mode \.classic-summary-container \{[\s\S]*?\.classic-mode \.classic-summary \.final-amount-block p\.text-\\[10px\\] \{[\s\S]*?\}/, '');

css += '\n' + classicSummaryReplacement;
fs.writeFileSync('src/index.css', css);
console.log('CSS updated successfully');
