const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const classicSummaryReplacement = `
.classic-summary {
  background-color: #f1f5f9;
  border-top: 2px solid #e2e8f0;
  border-bottom: 2px solid #e2e8f0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  align-items: stretch;
}
.classic-mode .classic-summary > div {
  background: transparent !important;
  border: none !important;
  border-right: 1px solid #cbd5e1 !important;
  padding: 4px 8px !important;
  flex: 1 1 0;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
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
.classic-mode .classic-summary span.text-xs {
  font-size: 10px;
  font-weight: 600;
  color: #334155 !important;
  margin-bottom: 2px;
  text-transform: uppercase;
}
.classic-mode .classic-summary input {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  height: auto !important;
  padding: 0 !important;
  color: #0f172a !important;
  font-weight: 700;
  font-size: 14px;
}
.classic-mode .classic-summary input:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
.classic-mode .classic-summary svg {
  display: none !important;
}
`;

css = css.replace(/\.classic-summary \{[\s\S]*?\.classic-mode \.classic-summary svg \{[\s\S]*?\}/, classicSummaryReplacement.trim());

if (css.includes('justify-content: flex-end;')) {
  console.log('CSS Replaced successfully');
} else {
  css += '\n' + classicSummaryReplacement;
  console.log('CSS Appended successfully');
}

fs.writeFileSync('src/index.css', css);
