/**
 * Y2K Flyer Generation API
 * 
 * Generates color and black & white Y2K-inspired table tent flyers
 * using the Python script
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { readFile, unlink } from 'fs/promises';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      artistName, 
      mainUrl, 
      tipUrl, 
      songUrl, 
      venmoHandle, 
      cashappHandle,
      version // 'color', 'bw', or 'both'
    } = req.body;

    // Validate required fields
    if (!artistName || !mainUrl) {
      return res.status(400).json({ 
        error: 'Artist name and main URL are required' 
      });
    }

    // Determine which version(s) to generate
    const generateColor = version === 'color' || version === 'both';
    const generateBW = version === 'bw' || version === 'both';
    if (!generateColor && !generateBW) {
      return res.status(400).json({ 
        error: 'Version must be "color", "bw", or "both"' 
      });
    }

    // Get the path to the Python script
    const scriptPath = join(process.cwd(), 'generate_y2k_flyers.py');
    
    // Build command arguments - escape properly for shell
    const escapeArg = (arg) => {
      // Escape single quotes and wrap in single quotes
      return `'${String(arg).replace(/'/g, "'\"'\"'")}'`;
    };

    const args = [
      '--artist', escapeArg(artistName),
      '--url', escapeArg(mainUrl),
      '--venmo', escapeArg(venmoHandle || '@your-venmo'),
      '--cashapp', escapeArg(cashappHandle || '$your-cashapp'),
    ];

    if (tipUrl) {
      args.push('--tip-url', escapeArg(tipUrl));
    }
    if (songUrl) {
      args.push('--song-url', escapeArg(songUrl));
    }

    const command = `python3 ${escapeArg(scriptPath)} ${args.join(' ')}`;

    // Execute Python script
    console.log('Generating flyers with command:', command);
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 30000, // 30 second timeout
      });

      if (stdout) {
        console.log('Python script stdout:', stdout);
      }
      
      if (stderr && !stderr.includes('warning') && !stderr.includes('DeprecationWarning')) {
        console.warn('Python script stderr:', stderr);
      }
    } catch (execError) {
      console.error('Error executing Python script:', execError);
      throw new Error(`Failed to execute Python script: ${execError.message}. Make sure Python 3 and required packages are installed.`);
    }

    // Read generated PDF files
    const colorPath = join(process.cwd(), 'Y2K_Request_Line_COLOR.pdf');
    const bwPath = join(process.cwd(), 'Y2K_Request_Line_BW.pdf');

    const results = {};

    if (generateColor) {
      try {
        const colorPdf = await readFile(colorPath);
        results.color = {
          data: colorPdf.toString('base64'),
          filename: 'Y2K_Request_Line_COLOR.pdf',
          mimeType: 'application/pdf'
        };
      } catch (error) {
        console.error('Error reading color PDF:', error);
        results.color = { error: 'Failed to generate color PDF' };
      }
    }

    if (generateBW) {
      try {
        const bwPdf = await readFile(bwPath);
        results.bw = {
          data: bwPdf.toString('base64'),
          filename: 'Y2K_Request_Line_BW.pdf',
          mimeType: 'application/pdf'
        };
      } catch (error) {
        console.error('Error reading B&W PDF:', error);
        results.bw = { error: 'Failed to generate B&W PDF' };
      }
    }

    // Clean up generated files (optional - could keep them for a while)
    try {
      if (generateColor) await unlink(colorPath);
      if (generateBW) await unlink(bwPath);
    } catch (cleanupError) {
      console.warn('Error cleaning up PDF files:', cleanupError);
      // Don't fail if cleanup fails
    }

    return res.status(200).json({
      success: true,
      flyers: results,
      message: 'Flyers generated successfully'
    });

  } catch (error) {
    console.error('Error generating flyers:', error);
    return res.status(500).json({ 
      error: 'Failed to generate flyers',
      details: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

