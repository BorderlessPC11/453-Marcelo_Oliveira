const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'public', 'templates', 'vistoria-template.docx');
const backupPath = path.join(__dirname, '..', 'public', 'templates', 'vistoria-template-backup.docx');

try {
  // Fazer backup
  fs.copyFileSync(templatePath, backupPath);
  console.log('✅ Backup criado:', backupPath);
  
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');
  
  if (!doc) {
    console.log('❌ Não foi possível encontrar document.xml');
    process.exit(1);
  }
  
  let xml = doc.asText();
  
  // Procurar padrões problemáticos
  console.log('\n🔍 Procurando por {/assinaturas} com diferentes encodings...');
  
  // Procurar variações
  const variacoes = [
    '{/assinaturas}',
    '{/ assinaturas}',
    '{ /assinaturas}',
    '{ / assinaturas}',
  ];
  
  let encontrado = false;
  for (const variacao of variacoes) {
    if (xml.includes(variacao)) {
      console.log(`✅ Encontrado: "${variacao}"`);
      encontrado = true;
    }
  }
  
  if (!encontrado) {
    console.log('❌ Nenhuma variação encontrada');
    
    // Verificar se há {#assinaturas} sem {/assinaturas}
    const regex = /\{#assinaturas\}[\s\S]*?(?=\{#|\{\/|$)/;
    const match = xml.match(regex);
    
    if (match) {
      console.log('\n📝 Conteúdo após {#assinaturas}:');
      const snippet = match[0].substring(0, 500);
      // Mostrar placeholders no snippet
      const placeholders = snippet.match(/\{[^}]+\}/g) || [];
      console.log('Placeholders:', placeholders.join(', '));
      
      // Adicionar {/assinaturas} após o {%assinatura}
      if (xml.includes('{%assinatura}')) {
        console.log('\n🔧 Adicionando {/assinaturas} após {%assinatura}...');
        
        // Encontrar a posição após {%assinatura}
        const assinaturaIdx = xml.indexOf('{%assinatura}');
        const insertPosition = assinaturaIdx + '{%assinatura}'.length;
        
        // Inserir {/assinaturas} em uma nova linha (parágrafo)
        const novoXml = xml.substring(0, insertPosition) + 
                        '{/assinaturas}' + 
                        xml.substring(insertPosition);
        
        // Atualizar o arquivo
        zip.file('word/document.xml', novoXml);
        
        const buf = zip.generate({ type: 'nodebuffer' });
        fs.writeFileSync(templatePath, buf);
        
        console.log('✅ Template atualizado com sucesso!');
        console.log('   Adicionado {/assinaturas} após {%assinatura}');
      }
    }
  }
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}
