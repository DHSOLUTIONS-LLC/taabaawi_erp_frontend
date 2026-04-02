import fs from 'fs/promises';
import path from 'path';

async function copy404() {
  try {
    const distDir = path.join(process.cwd(), 'dist');
    const indexHtml = path.join(distDir, 'index.html');
    const notFoundHtml = path.join(distDir, '404.html');
    
    // Check if index.html exists
    await fs.access(indexHtml);
    
    // Copy index.html to 404.html
    await fs.copyFile(indexHtml, notFoundHtml);
    console.log('✅ 404.html created successfully');
  } catch (error) {
    console.error('❌ Error creating 404.html:', error.message);
  }
}

copy404();