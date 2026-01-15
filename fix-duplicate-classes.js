const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'apps/docs/src');

function fixDuplicateClasses(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix duplicate className attributes
  content = content.replace(/className="([^"]*)" className="([^"]*)"/g, (match, first, second) => {
    return `className="${first}"`;
  });

  if (content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
    return true;
  }

  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let totalChanged = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      totalChanged += walkDir(filePath);
    } else if (file.endsWith('.tsx') && filePath.includes('page.tsx')) {
      if (fixDuplicateClasses(filePath)) {
        totalChanged++;
      }
    }
  }

  return totalChanged;
}

const changedFiles = walkDir(docsDir);
console.log(`Fixed ${changedFiles} files`);