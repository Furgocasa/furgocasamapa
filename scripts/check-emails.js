const fs = require('fs');
const files = fs.readdirSync('mail_mapas').filter(f => f.endsWith('.html') && !f.startsWith('Z_'));

files.forEach(f => {
    let content = fs.readFileSync('mail_mapas/' + f, 'utf8');
    let hasCenter = content.includes('<center');
    let hasContainer = content.includes('class="container"');
    let hasMSO = content.includes('<!--[if mso]>');
    console.log(f.padEnd(45) + ' | center: ' + (hasCenter ? 'Y' : 'N') + ' | container: ' + (hasContainer ? 'Y' : 'N') + ' | MSO: ' + (hasMSO ? 'Y' : 'N'));
});