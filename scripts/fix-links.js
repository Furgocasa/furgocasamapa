const fs = require('fs');
const glob = require('glob');

const files = glob.sync('components/banners/*.tsx');
let changed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const old = content;
  
  // Reemplazar URLs rotas de casicinco (.com/restaurante, .com/bar, etc) por .com
  // Mantenemos /ruta y /mapa que sí deben existir, y las URLs base de la home
  content = content.replace(/https:\/\/www\.casicinco\.com\/(restaurante|bar|hotel)(\/[a-z]+)?(\?utm[^\"']*)/g, 'https://www.casicinco.com$3');
  
  if(content !== old) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
    changed++;
  }
});

console.log('Total files changed:', changed);