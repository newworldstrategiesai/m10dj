/**
 * Test PDF Generation Locally
 * Run this with: node test-pdf-generation.js
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing PDF Generation...\n');

try {
  // Create a simple test PDF
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  const outputPath = path.join(__dirname, 'test-invoice.pdf');
  const writeStream = fs.createWriteStream(outputPath);

  doc.pipe(writeStream);

  // Add some content
  doc
    .fontSize(28)
    .fillColor('#fcba00')
    .font('Helvetica-Bold')
    .text('M10 DJ Company', 50, 50);

  doc
    .fontSize(16)
    .fillColor('#111827')
    .text('Test Invoice', 50, 100);

  doc
    .fontSize(12)
    .fillColor('#6b7280')
    .text('This is a test PDF to verify PDFKit is working correctly.', 50, 150);

  doc
    .text('If you can read this, PDFKit is generating valid PDFs.', 50, 180);

  doc.end();

  writeStream.on('finish', () => {
    console.log('✅ PDF generated successfully!');
    console.log(`📄 File location: ${outputPath}`);
    console.log(`📦 File size: ${fs.statSync(outputPath).size} bytes`);
    console.log('\n💡 Try opening the file: test-invoice.pdf');
    console.log('   If it opens, the issue is with the API route or response handling.');
    console.log('   If it doesn\'t open, there\'s an issue with PDFKit installation.');
  });

  writeStream.on('error', (error) => {
    console.error('❌ Error writing PDF:', error);
  });

} catch (error) {
  console.error('❌ Error generating PDF:', error);
  console.error(error.stack);
}

