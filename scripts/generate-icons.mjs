#!/usr/bin/env node
/**
 * Script para gerar icones PNG a partir do SVG
 * Uso: npm run generate:icons
 * 
 * Dependências: sharp
 * Instalar: npm install --save-dev sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SIZES = [
  { size: 192, name: 'icon-192.png', maskable: false },
  { size: 192, name: 'icon-192-maskable.png', maskable: true },
  { size: 512, name: 'icon-512.png', maskable: false },
  { size: 512, name: 'icon-512-maskable.png', maskable: true },
];

const SVG_PATH = path.join(__dirname, '../public/icon.svg');
const OUTPUT_DIR = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    console.log('🎨 Gerando icones PNG...\n');

    if (!fs.existsSync(SVG_PATH)) {
      console.error(`❌ Arquivo SVG não encontrado: ${SVG_PATH}`);
      console.log('\nCrie um arquivo SVG em public/icon.svg');
      process.exit(1);
    }

    const svgBuffer = fs.readFileSync(SVG_PATH);

    for (const icon of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, icon.name);
      
      console.log(`📦 Gerando ${icon.name} (${icon.size}x${icon.size})...`);
      
      await sharp(svgBuffer)
        .png()
        .resize(icon.size, icon.size, {
          fit: 'cover',
          background: '#2563eb'
        })
        .toFile(outputPath);
      
      console.log(`✅ Criado: ${icon.name}\n`);
    }

    console.log('🎉 Todos os icones foram gerados com sucesso!');
    console.log(`\nArquivos criados em: ${OUTPUT_DIR}`);
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ Erro: sharp não está instalado');
      console.log('\nInstale com: npm install --save-dev sharp');
      process.exit(1);
    }
    
    console.error('❌ Erro ao gerar icones:', error.message);
    process.exit(1);
  }
}

generateIcons();
