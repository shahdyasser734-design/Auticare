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

  // We want to replace standard bg-white card structures with standard-card.
  // We'll target className strings that contain bg-white.
  // Actually, some bg-white are just small badges or inputs. We only want to replace it for structural cards.
  // Structural cards usually have p-4, p-5, p-6, p-8 AND rounded-something.
  
  // A safer approach: just replace "bg-white dark:bg-slate-900/60 border border-stone-150" with "standard-card"
  // Let's just do a blanket regex for bg-white but ONLY in components that look like cards.
  
  // Replace long specific tails:
  content = content.replace(/bg-white\s+dark:bg-[a-z0-9/.-]+\s+border\s+border-[a-z0-9.-]+\s+shadow-[a-z0-9.-]+/g, 'standard-card');
  content = content.replace(/bg-white\s+dark:bg-[a-z0-9/.-]+\s+rounded-[a-z0-9.-]+\s+shadow-[a-z0-9.-]+\s+border\s+border-[a-z0-9.-]+/g, 'standard-card');
  content = content.replace(/bg-white\s+dark:bg-[a-z0-9/.-]+\s+rounded-[a-z0-9.-]+\s+border\s+border-[a-z0-9.-]+/g, 'standard-card');
  content = content.replace(/bg-white\s+rounded-[a-z0-9.-]+\s+shadow-[a-z0-9.-]+\s+border\s+border-[a-z0-9.-]+/g, 'standard-card');
  content = content.replace(/bg-white\s+rounded-[a-z0-9.-]+\s+border\s+border-[a-z0-9.-]+/g, 'standard-card');
  
  // Clean up remaining duplicate rounded, shadow, or borders that standard-card handles
  // standard-card handles: bg, border, border-color, rounded, shadow.
  // Actually standard-card is exactly what we need.
  // Let's replace any bg-white that has rounded-2xl or rounded-xl and p-4 or p-6 with standard-card
  
  // Another pass for simpler ones
  content = content.replace(/bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/g, 'standard-card p-6');
  content = content.replace(/bg-white dark:bg-slate-[0-9]+\/?(?:[0-9]+)?/g, 'standard-card');
  content = content.replace(/bg-white rounded-(?:xl|2xl|3xl|lg)\s+shadow-(?:sm|md|lg)\s+p-/g, 'standard-card p-');
  content = content.replace(/bg-white\s+rounded-2xl\s+p-/g, 'standard-card p-');
  content = content.replace(/bg-white\s+rounded-xl\s+p-/g, 'standard-card p-');
  
  // Just in case we missed some plain bg-white on cards
  // If it's a section or div with bg-white and p- (padding), it's probably a card.
  content = content.replace(/className="([^"]*)bg-white([^"]*)p-([0-9]+)([^"]*)"/g, 'className="$1standard-card$2p-$3$4"');
  
  // Remove conflicting utilities
  // Remove border border-stone-150, border-stone-200, etc when standard-card is present
  if (content.includes('standard-card')) {
     content = content.replace(/standard-card(.*?)(?:border\s+border-stone-[0-9]+|border\s+border-slate-[0-9]+|border\s+border-gray-[0-9]+)/g, 'standard-card$1');
     content = content.replace(/standard-card(.*?)(?:rounded-2xl|rounded-xl|rounded-lg|rounded-3xl)/g, 'standard-card$1');
     content = content.replace(/standard-card(.*?)(?:shadow-sm|shadow-md|shadow-lg|shadow-xl|shadow-2xl|shadow)/g, 'standard-card$1');
     content = content.replace(/standard-card(.*?)(?:dark:border-white\/[0-9]+|dark:border-slate-[0-9]+)/g, 'standard-card$1');
  }

  // Remove duplicate spaces
  content = content.replace(/className="([^"]+)"/g, (match, p1) => {
     return `className="${p1.replace(/\s+/g, ' ').trim()}"`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated: ${file}`);
    changedCount++;
  }
});

console.log(`Updated ${changedCount} files.`);
