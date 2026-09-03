const fs = require('fs');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');

const turndownService = new TurndownService({ headingStyle: 'atx' });

const files = [
    {
        path: 'C:\\Users\\Jack\\.gemini\\antigravity-ide\\brain\\c209a002-f140-4fd3-847d-2a60df234aba\\.system_generated\\steps\\187\\content.md',
        exportName: 'TERMS_CONTRACT',
        title: 'TÉRMINOS Y CONDICIONES GENERALES DE SERVICIO'
    },
    {
        path: 'C:\\Users\\Jack\\.gemini\\antigravity-ide\\brain\\c209a002-f140-4fd3-847d-2a60df234aba\\.system_generated\\steps\\188\\content.md',
        exportName: 'PRIVACY_CONTRACT',
        title: 'POLÍTICA DE PRIVACIDAD Y TRATAMIENTO DE DATOS'
    },
    {
        path: 'C:\\Users\\Jack\\.gemini\\antigravity-ide\\brain\\c209a002-f140-4fd3-847d-2a60df234aba\\.system_generated\\steps\\189\\content.md',
        exportName: 'REFUND_CONTRACT',
        title: 'POLÍTICA DE CAMBIOS Y DEVOLUCIONES'
    },
    {
        path: 'C:\\Users\\Jack\\.gemini\\antigravity-ide\\brain\\c209a002-f140-4fd3-847d-2a60df234aba\\.system_generated\\steps\\190\\content.md',
        exportName: 'DATA_DELETION_CONTRACT',
        title: 'ELIMINACIÓN Y CANCELACIÓN DE DATOS'
    }
];

let output = '';

for (const file of files) {
    const rawContent = fs.readFileSync(file.path, 'utf8');
    // Splitting by --- might fail if --- is used in the markdown. Let's just pass the whole content if there's no ---.
    // The content.md from read_url_content usually has frontmatter.
    const parts = rawContent.split(/^---$/m);
    const htmlPart = parts.length >= 3 ? parts.slice(2).join('---') : rawContent;
    
    const dom = new JSDOM(htmlPart);
    const document = dom.window.document;
    
    let article = document.querySelector('.legal-article') || document.querySelector('.legal-layout') || document.body;
    
    if (article) {
        // Fix some headings
        const h2s = article.querySelectorAll('h2');
        h2s.forEach(h2 => {
            const num = h2.previousElementSibling;
            if (num && num.classList && num.classList.contains('section-num')) {
                h2.textContent = num.textContent + ': ' + h2.textContent;
            }
        });

        let markdown = turndownService.turndown(article.innerHTML);
        
        // Escape backticks in markdown to avoid breaking the template string
        markdown = markdown.replace(/`/g, '\\`');
        
        // Clean up markdown a bit (remove excessive line breaks)
        markdown = markdown.replace(/\\n/g, '\n');
        
        output += `export const ${file.exportName} = \`# ${file.title}\n\n${markdown}\n\n---\n**FIRMA ELECTRÓNICA VINCULANTE:**\nAl firmar digitalmente este documento a través de MiamSign, EL CLIENTE y LA AGENCIA se adhieren en su totalidad y de forma irrenunciable a todas las estipulaciones de este contrato.\`;\n\n`;
    } else {
        console.log('No content found for ' + file.exportName);
    }
}

fs.writeFileSync('C:\\Users\\Jack\\.gemini\\antigravity-ide\\scratch\\miamsign\\src\\app\\templates.ts', output);
console.log('Templates generated successfully!');
