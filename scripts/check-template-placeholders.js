const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'public', 'templates', 'vistoria-template.docx');

try {
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');
  
  if (!doc) {
    console.log('❌ Não foi possível encontrar document.xml no template');
    process.exit(1);
  }
  
  const xml = doc.asText();
  
  console.log('📄 VERIFICANDO PLACEHOLDERS NO TEMPLATE:\n');
  
  // Verificar placeholders de loops
  console.log('🔁 LOOPS:');
  console.log('  {#fotos}:', xml.includes('{#fotos}') ? '✅' : '❌');
  console.log('  {/fotos}:', xml.includes('{/fotos}') ? '✅' : '❌');
  console.log('  {#assinaturas}:', xml.includes('{#assinaturas}') ? '✅' : '❌');
  console.log('  {/assinaturas}:', xml.includes('{/assinaturas}') ? '✅' : '❌');
  
  console.log('\n🖼️ PLACEHOLDERS DE IMAGEM:');
  console.log('  {%foto}:', xml.includes('{%foto}') ? '✅' : '❌');
  console.log('  {%assinatura}:', xml.includes('{%assinatura}') ? '✅' : '❌');
  
  // Extrair contexto do loop de assinaturas
  if (xml.includes('{#assinaturas}')) {
    const startIdx = xml.indexOf('{#assinaturas}');
    const endIdx = xml.indexOf('{/assinaturas}');
    
    if (endIdx > startIdx) {
      const loopContent = xml.substring(startIdx, endIdx + '{/assinaturas}'.length);
      console.log('\n📝 CONTEÚDO DO LOOP {#assinaturas}...{/assinaturas}:');
      
      // Extrair apenas os placeholders do loop
      const placeholders = loopContent.match(/\{[#%\/]?[\w]+\}/g) || [];
      console.log('Placeholders encontrados:', placeholders.join(', '));
      
      // Verificar se tem o placeholder de imagem
      if (loopContent.includes('{%assinatura}')) {
        console.log('✅ Loop de assinaturas TEM o placeholder {%assinatura}');
      } else {
        console.log('❌ Loop de assinaturas NÃO TEM o placeholder {%assinatura}');
        console.log('   Isso explica porque as assinaturas não aparecem no documento!');
      }
    }
  }
  
  console.log('\n✅ Verificação concluída');
  
} catch (error) {
  console.error('❌ Erro ao verificar template:', error.message);
  process.exit(1);
}
