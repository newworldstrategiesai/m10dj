import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find contract by signing token
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, contract_number, contract_html, status')
      .eq('signing_token', token)
      .single();

    if (contractError || !contract) {
      // Try participant token
      const { data: participant, error: participantError } = await supabase
        .from('contract_participants')
        .select(`
          contracts (
            id,
            contract_number,
            contract_html,
            status
          )
        `)
        .eq('signing_token', token)
        .single();

      if (participantError || !participant || !participant.contracts) {
        return res.status(404).json({ error: 'Contract not found or invalid token' });
      }

      // Use contract from participant
      const contractData = participant.contracts;
      
      if (!contractData.contract_html) {
        return res.status(400).json({ error: 'Contract content not available' });
      }

      // Prepare HTML for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              margin: 0.75in;
              size: letter;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              line-height: 1.6;
              color: #000;
              margin: 0;
              padding: 0;
            }
            .page-break {
              page-break-before: always;
            }
            .no-print {
              display: none;
            }
            @media print {
              body { margin: 0; }
              .signature-box {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${contractData.contract_html}
        </body>
        </html>
      `;

      // Launch puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        margin: {
          top: '0.75in',
          right: '0.75in',
          bottom: '0.75in',
          left: '0.75in'
        },
        printBackground: true,
        preferCSSPageSize: false
      });

      await browser.close();

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${contractData.contract_number || 'contract'}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
      return;
    }

    if (!contract.contract_html) {
      return res.status(400).json({ error: 'Contract content not available' });
    }

    // Prepare HTML for PDF (add print styles)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            margin: 0.75in;
            size: letter;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.6;
            color: #000;
            margin: 0;
            padding: 0;
          }
          .page-break {
            page-break-before: always;
          }
          .no-print {
            display: none;
          }
          @media print {
            body { margin: 0; }
            .signature-box {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${contract.contract_html}
      </body>
      </html>
    `;

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      },
      printBackground: true,
      preferCSSPageSize: false
    });

    await browser.close();

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${contract.contract_number || 'contract'}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    });
  }
}
