# Y2K-Inspired Song Request & Tip Flyer Generator

A Python script that generates nostalgic late-90s/early-2000s inspired table tent flyers for live musicians. Produces both full-color and high-contrast black & white versions optimized for printing.

## Features

- **Y2K Aesthetic**: Hot magenta, cyan, metallic gradients, pixel art, starbursts, butterflies, hearts
- **Dual Versions**: 
  - Full-color version with vibrant gradients and chrome effects
  - Black & white version with high-contrast halftones, heavy outlines, and dithered patterns
- **Print-Ready**: 4×6" (A6 when folded) with 3mm bleed and crop marks at 300 DPI
- **QR Codes**: 
  - Large central QR code (3.5×3.5cm) for main request URL
  - Two optional smaller QR codes for tip and song requests
- **Customizable**: CLI arguments for artist name, URLs, and payment handles

## Installation

```bash
pip install -r requirements_flyers.txt
```

Or manually:
```bash
pip install reportlab qrcode[pil] Pillow numpy
```

## Usage

### Basic usage (default values):
```bash
python generate_y2k_flyers.py
```

This generates:
- `Y2K_Request_Line_COLOR.pdf` - Full color version
- `Y2K_Request_Line_BW.pdf` - Black & white version

### Custom usage:
```bash
python generate_y2k_flyers.py \
  --artist "DJ SPARKLE" \
  --url "https://yoursite.com/request" \
  --tip-url "https://yoursite.com/tip" \
  --song-url "https://yoursite.com/songs" \
  --venmo "@DJ-SPARKLE" \
  --cashapp "$DJSPARKLE"
```

### Command-line arguments:

- `--artist`: Artist/DJ name (default: "DJ SPARKLE")
- `--url`: Main QR code URL (default: "https://example.com/request")
- `--tip-url`: Tip QR code URL (optional, default: "https://example.com/tip")
- `--song-url`: Song request QR code URL (optional, default: "https://example.com/songs")
- `--venmo`: Venmo handle (default: "@DJ-SPARKLE")
- `--cashapp`: Cash App handle (default: "$DJSPARKLE")

## Design Details

### Color Version:
- Gradient background (magenta → cyan)
- Chrome text effects with cyan/magenta glows
- Sparkly glitter specks
- Starbursts and decorative elements
- Scanline overlay for VHS effect

### Black & White Version:
- High-contrast design optimized for photocopying
- Heavy black outlines with white text
- Dithered patterns instead of gradients
- Halftone overlays
- Bold geometric patterns
- "Photocopy me ♡" watermark

## Output Specifications

- **Page Size**: 4" × 6" (101.6mm × 152.4mm)
- **Bleed**: 3mm on all sides
- **Resolution**: 300 DPI
- **Format**: PDF with crop marks
- **QR Code Sizes**: 
  - Main: 35mm × 35mm (3.5cm)
  - Optional: 20mm × 20mm each

## Print Recommendations

1. **Color Version**: Use high-quality color printing (inkjet or digital press)
2. **B&W Version**: Optimized for laser printers and photocopiers - will maintain high contrast even after multiple copies

## Customization

To modify the design, edit the constants at the top of `generate_y2k_flyers.py`:

- `PAGE_WIDTH`, `PAGE_HEIGHT`: Change dimensions
- `BLEED`: Adjust bleed size
- Color palette variables: Modify Y2K color scheme
- Default values: Change placeholder text/URLs

## License

Free to use and modify for your projects!

