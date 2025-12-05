// scripts/clean-console.js
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');

// Build papkasi bormi tekshirish
if (!fs.existsSync(buildDir)) {
  process.exit(0);
}

// Rekursiv fayllarni qayta ishlash
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      cleanFile(filePath);
    }
  });
}

// JavaScript fayllarni tozalash
function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 1. console.*() metodlarini o'chirish
    content = content.replace(
      /console\s*\.\s*\w+\s*\([^)]*\)\s*;?/g,
      ''
    );
    
    // 2. console['method']() shaklini o'chirish
    content = content.replace(
      /console\s*\[\s*['"][^'"]+['"]\s*\]\s*\([^)]*\)\s*;?/g,
      ''
    );
    
    // 3. debugger statement'larini o'chirish
    content = content.replace(/debugger\s*;?/g, '');
    
    // 4. Agar o'zgartirish bo'lsa, faylni saqlash
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (error) {
    // Xatoliklarni e'tiborsiz qoldirish
  }
}

// Scriptni ishga tushirish
processDirectory(buildDir);