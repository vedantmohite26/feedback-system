const fs = require('fs');
const path = require('path');

const d = __dirname;
const files = fs.readdirSync(d).filter(f => f.endsWith('.html'));

files.forEach(file => {
  let content = fs.readFileSync(path.join(d, file), 'utf8');

  // Colors
  content = content.replace(/text-slate-200/g, 'text-slate-700');
  content = content.replace(/text-slate-300/g, 'text-slate-600');
  content = content.replace(/text-slate-400/g, 'text-slate-500');
  content = content.replace(/text-white/g, 'text-slate-800');
  
  content = content.replace(/bg-slate-900/g, 'bg-white');
  content = content.replace(/bg-slate-800/g, 'bg-slate-50');
  content = content.replace(/bg-white\/5/g, 'bg-indigo-50');
  content = content.replace(/bg-white\/10/g, 'bg-indigo-100');
  content = content.replace(/border-slate-800/g, 'border-slate-200');

  // Replace text-white inside buttons or active contexts back to text-white if needed, but let's be careful.
  // Wait, if I replaced all text-white with text-slate-800, then buttons that use bg-primary (which are indigo) will have dark text!
  // Let me fix that. Any element with bg-[var(--light-accent)], bg-primary, bg-teal-600, etc. should have text-white.
  content = content.replace(/(bg-\[var\(--light-accent\)\]|bg-primary|bg-teal-600|bg-red-500|bg-indigo-600)[^>]*?text-slate-800/g, (match) => {
      return match.replace('text-slate-800', 'text-white');
  });

  // Admin layouts hardcoded dark colors
  content = content.replace(/background:#0a0e1a;/g, 'background:var(--gradient-body, #f8fafc);');
  content = content.replace(/background:#0d1221;/g, 'background:var(--bg-color, #ffffff);');
  content = content.replace(/rgba\(10,14,26,0\.95\)/g, 'var(--bg-color)');
  content = content.replace(/rgba\(15,22,41,0\.9\)/g, 'rgba(255,255,255,0.7)');
  content = content.replace(/background:#0f1629;/g, 'background:var(--bg-color, #ffffff);');
  
  // The dark theme style overrides
  const darkOverrideRegex = /\/\* --- Dark Theme Inner Panel Overrides --- \*\/[\s\S]*?<\/style>/;
  const lightOverrides = `/* --- Light Theme Panel Overrides --- */
  #admin-content .shadow-sm { box-shadow: var(--shadow-light) !important; border: 1px solid var(--light-border) !important; }
  #admin-content .bg-white { background: var(--bg-color) !important; }
  #admin-content th { background: var(--gradient-body) !important; color: #64748b !important; }
  #admin-content .neu-skeleton { background: linear-gradient(90deg,rgba(0,0,0,0.02) 25%,rgba(0,0,0,0.05) 50%,rgba(0,0,0,0.02) 75%) !important; background-size: 200% 100%; animation: neuShimmer 1.5s infinite; }
</style>`;
  if(content.match(darkOverrideRegex)) {
      content = content.replace(darkOverrideRegex, lightOverrides);
  }
  
  // Replace body class if it starts with text-slate-XYZ
  content = content.replace(/<body class="text-slate-[0-9]+/g, '<body class="text-slate-800');

  fs.writeFileSync(path.join(d, file), content, 'utf8');
  console.log(`Updated ${file}`);
});
