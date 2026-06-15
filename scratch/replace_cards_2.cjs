const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, '..', 'src', 'pages')).concat(walk(path.join(__dirname, '..', 'src', 'components')));

let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace bg-[var(--surface-strong)] with standard-card if it's on a card
  content = content.replace(/bg-\[var\(--surface-strong\)\]\s+dark:bg-slate-[0-9]+\/[0-9]+\s+shadow-md\s+hover:shadow-xl\s+hover:-translate-y-[0-9.]+\s+transition-all\s+duration-300\s+rounded-\[1\.5rem\]\s+overflow-hidden/g, 'standard-card overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300');
  content = content.replace(/border\s+border-stone-[0-9]+\/[0-9]+\s+dark:border-white\/[0-9]+\s+bg-\[var\(--surface-strong\)\]/g, 'standard-card');
  content = content.replace(/border\s+border-stone-[0-9]+\/[0-9]+\s+dark:border-white\/[0-9]+\s+shadow-sm\s+bg-\[var\(--surface-strong\)\]/g, 'standard-card');
  
  // Quick Actions format
  content = content.replace(/bg-\[var\(--surface-strong\)\]\s+dark:bg-slate-[0-9]+\/[0-9]+\s+rounded-2xl\s+border\s+border-stone-[0-9]+\/[0-9]+\s+dark:border-white\/[0-9]+\s+shadow-sm/g, 'standard-card');
  
  // Clean up any double standard-card
  content = content.replace(/standard-card(\s+)standard-card/g, 'standard-card');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated var(--surface-strong): ${file}`);
    changedCount++;
  }
});

console.log(`Updated ${changedCount} files.`);
