#!/usr/bin/env python3
"""
Y2K-Inspired Song Request & Tip Table Tent Generator
Generates both color and black & white versions of a nostalgic late-90s/early-2000s flyer.

Requirements:
    pip install reportlab qrcode[pil] Pillow numpy

Usage:
    python generate_y2k_flyers.py
    # or with custom values:
    python generate_y2k_flyers.py --artist "DJ SPARKLE" --url "https://yoursite.com/request"
"""

import argparse
from reportlab.lib.pagesizes import A6
from reportlab.lib.units import mm, inch
from reportlab.lib.colors import black, white, HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.graphics import renderPDF
from reportlab.graphics.shapes import Drawing, Line, Circle, Rect, Group
from reportlab.graphics import shapes
import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import io
import math
import numpy as np
from typing import Tuple, Optional

# ============================================================================
# CONFIGURATION
# ============================================================================

# Page dimensions (A6 unfolded: 105mm x 148mm, or use 4x6" = 101.6mm x 152.4mm)
PAGE_WIDTH = 4 * inch  # 101.6mm
PAGE_HEIGHT = 6 * inch  # 152.4mm
BLEED = 3 * mm
DPI = 300
EFFECTIVE_WIDTH = PAGE_WIDTH - (2 * BLEED)
EFFECTIVE_HEIGHT = PAGE_HEIGHT - (2 * BLEED)

# Y2K Color Palette
COLOR_MAGENTA = HexColor('#FF0090')
COLOR_CYAN = HexColor('#00FFFF')
COLOR_LIME = HexColor('#00FF00')
COLOR_SILVER_START = HexColor('#C0C0C0')
COLOR_SILVER_END = HexColor('#FFFFFF')

# Placeholder values (can be overridden via CLI)
DEFAULT_ARTIST = "DJ SPARKLE"
DEFAULT_MAIN_URL = "https://example.com/request"
DEFAULT_TIP_URL = "https://example.com/tip"
DEFAULT_SONG_URL = "https://example.com/songs"
DEFAULT_VENMO = "@DJ-SPARKLE"
DEFAULT_CASHAPP = "$DJSPARKLE"


# ============================================================================
# QR CODE GENERATION
# ============================================================================

def generate_qr_code(url: str, size_px: int = 400, border: int = 4) -> Image.Image:
    """Generate a QR code image."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img = img.resize((size_px, size_px), Image.Resampling.LANCZOS)
    return img


# ============================================================================
# DITHERING & HALFTONE FUNCTIONS FOR B&W
# ============================================================================

def floyd_steinberg_dither(image: Image.Image) -> Image.Image:
    """Apply Floyd-Steinberg dithering to convert color/gray to B&W."""
    img_array = np.array(image.convert('L'), dtype=float)
    height, width = img_array.shape
    
    for y in range(height):
        for x in range(width):
            old_pixel = img_array[y, x]
            new_pixel = 255 if old_pixel > 127 else 0
            img_array[y, x] = new_pixel
            error = old_pixel - new_pixel
            
            if x + 1 < width:
                img_array[y, x + 1] += error * 7/16
            if y + 1 < height:
                if x > 0:
                    img_array[y + 1, x - 1] += error * 3/16
                img_array[y + 1, x] += error * 5/16
                if x + 1 < width:
                    img_array[y + 1, x + 1] += error * 1/16
    
    return Image.fromarray(img_array.astype(np.uint8), mode='L')


def create_halftone_pattern(width: int, height: int, density: float = 0.3) -> Image.Image:
    """Create a halftone dot pattern."""
    img = Image.new('L', (width, height), 255)
    draw = ImageDraw.Draw(img)
    spacing = 8
    radius = spacing * density
    
    for y in range(0, height, spacing):
        for x in range(0, width, spacing):
            offset_x = (y % (spacing * 2)) * 0.5
            draw.ellipse(
                [x + offset_x - radius, y - radius, x + offset_x + radius, y + radius],
                fill=0
            )
    return img


def create_checkerboard(width: int, height: int, square_size: int = 10) -> Image.Image:
    """Create a checkerboard pattern."""
    img = Image.new('1', (width, height), 1)
    for y in range(0, height, square_size):
        for x in range(0, width, square_size):
            if (x // square_size + y // square_size) % 2 == 0:
                for i in range(square_size):
                    for j in range(square_size):
                        if x + i < width and y + j < height:
                            img.putpixel((x + i, y + j), 0)
    return img


# ============================================================================
# Y2K DECORATIVE ELEMENTS
# ============================================================================

def draw_starburst(c: canvas.Canvas, x: float, y: float, radius: float, 
                   color: HexColor, num_rays: int = 16, is_bw: bool = False):
    """Draw a starburst pattern."""
    c.setStrokeColor(color if not is_bw else black)
    c.setFillColor(color if not is_bw else black)
    if is_bw:
        c.setLineWidth(2)
    else:
        c.setLineWidth(1)
    
    # Draw starburst using path
    path = c.beginPath()
    for i in range(num_rays * 2):
        angle = (i * math.pi) / num_rays
        r = radius if i % 2 == 0 else radius * 0.5
        px = x + r * math.cos(angle)
        py = y + r * math.sin(angle)
        if i == 0:
            path.moveTo(px, py)
        else:
            path.lineTo(px, py)
    path.close()
    c.drawPath(path, fill=1, stroke=1)


def draw_pixel_heart(c: canvas.Canvas, x: float, y: float, size: float, 
                     color: HexColor, is_bw: bool = False):
    """Draw a pixelated heart."""
    pixel_size = size / 8
    heart_pattern = [
        "  **  **  ",
        " **** **** ",
        "**********",
        " ********* ",
        "  *******  ",
        "   *****   ",
        "    ***    ",
        "     *     ",
    ]
    
    c.setFillColor(color if not is_bw else black)
    for row_idx, row in enumerate(heart_pattern):
        for col_idx, char in enumerate(row):
            if char == '*':
                px = x + (col_idx - len(row)/2) * pixel_size
                py = y - row_idx * pixel_size
                c.rect(px, py, pixel_size, pixel_size, fill=1, stroke=0)


def draw_butterfly_silhouette(c: canvas.Canvas, x: float, y: float, width: float, 
                              height: float, color: HexColor, is_bw: bool = False):
    """Draw a butterfly silhouette."""
    c.setFillColor(color if not is_bw else black)
    c.setStrokeColor(color if not is_bw else black)
    c.setLineWidth(2 if is_bw else 1)
    
    # Top wings
    c.ellipse(x - width/2, y, x, y + height/2, fill=1, stroke=1)
    c.ellipse(x, y, x + width/2, y + height/2, fill=1, stroke=1)
    # Bottom wings
    c.ellipse(x - width/3, y - height/3, x, y, fill=1, stroke=1)
    c.ellipse(x, y - height/3, x + width/3, y, fill=1, stroke=1)
    # Body
    c.rect(x - width/20, y - height/2, width/10, height, fill=1, stroke=1)


def draw_scanlines(c: canvas.Canvas, y_start: float, y_end: float, 
                   x_start: float, x_end: float, color: HexColor, is_bw: bool = False):
    """Draw VHS-style scanlines."""
    c.setStrokeColor(color if not is_bw else HexColor('#808080'))
    c.setLineWidth(0.5)
    spacing = 3
    for y in range(int(y_start), int(y_end), spacing):
        if y % (spacing * 2) == 0:
            c.line(x_start, y, x_end, y)


def draw_cd_reflection(c: canvas.Canvas, x: float, y: float, radius: float, 
                       is_bw: bool = False):
    """Draw a CD with reflection effect."""
    # Outer circle
    c.setStrokeColor(black)
    c.setFillColor(white)
    c.circle(x, y, radius, fill=1, stroke=1)
    
    # Inner hole
    hole_radius = radius * 0.15
    c.circle(x, y, hole_radius, fill=1, stroke=1)
    
    # Reflection lines
    c.setStrokeColor(HexColor('#C0C0C0') if not is_bw else HexColor('#808080'))
    c.setLineWidth(1)
    for angle in [math.pi/6, math.pi/3, math.pi/2]:
        x1 = x + (radius - hole_radius) * math.cos(angle) * 0.5
        y1 = y + (radius - hole_radius) * math.sin(angle) * 0.5
        x2 = x + radius * math.cos(angle) * 0.8
        y2 = y + radius * math.sin(angle) * 0.8
        c.line(x1, y1, x2, y2)


def draw_glitter_specks(c: canvas.Canvas, x_min: float, x_max: float, 
                        y_min: float, y_max: float, count: int, 
                        color: HexColor, is_bw: bool = False):
    """Draw random glitter specks."""
    import random
    c.setFillColor(color if not is_bw else white)
    for _ in range(count):
        px = random.uniform(x_min, x_max)
        py = random.uniform(y_min, y_max)
        size = random.uniform(1, 3)
        if is_bw:
            # Make bigger and more visible in B&W
            size = random.uniform(2, 4)
        c.circle(px, py, size, fill=1, stroke=0)


# ============================================================================
# MAIN FLYER GENERATION
# ============================================================================

def generate_flyer(
    artist_name: str,
    main_url: str,
    tip_url: Optional[str],
    song_url: Optional[str],
    venmo_handle: str,
    cashapp_handle: str,
    is_color: bool = True,
    output_filename: str = "Y2K_Request_Line_COLOR.pdf"
):
    """Generate a single flyer PDF."""
    
    # Calculate dimensions with bleed
    total_width = PAGE_WIDTH + (2 * BLEED)
    total_height = PAGE_HEIGHT + (2 * BLEED)
    
    # Create PDF canvas
    c = canvas.Canvas(output_filename, pagesize=(total_width, total_height))
    
    # Background
    if is_color:
        # Gradient background (approximated with rectangles)
        for i in range(30):
            alpha = i / 29.0
            # Interpolate between magenta (#FF0090) and cyan (#00FFFF)
            r = int(255 * (1 - alpha) + 0 * alpha)  # FF -> 00
            g = int(0 * (1 - alpha) + 255 * alpha)  # 00 -> FF
            b = int(144 * (1 - alpha) + 255 * alpha)  # 90 -> FF
            color = HexColor(f"#{r:02X}{g:02X}{b:02X}")
            c.setFillColor(color)
            y_pos = BLEED + (EFFECTIVE_HEIGHT / 30) * i
            c.rect(BLEED, y_pos, EFFECTIVE_WIDTH, EFFECTIVE_HEIGHT / 30, 
                   fill=1, stroke=0)
    else:
        # High-contrast B&W background with pattern
        c.setFillColor(white)
        c.rect(BLEED, BLEED, EFFECTIVE_WIDTH, EFFECTIVE_HEIGHT, fill=1, stroke=0)
        
        # Add subtle diagonal stripes in corners
        c.setStrokeColor(HexColor('#E0E0E0'))
        c.setLineWidth(1)
        stripe_spacing = 10
        for i in range(0, int(EFFECTIVE_WIDTH + EFFECTIVE_HEIGHT), stripe_spacing):
            x1 = BLEED + max(0, i - EFFECTIVE_HEIGHT)
            y1 = BLEED + min(EFFECTIVE_HEIGHT, i)
            x2 = BLEED + min(EFFECTIVE_WIDTH, i)
            y2 = BLEED + max(0, EFFECTIVE_HEIGHT - (EFFECTIVE_WIDTH - i))
            if x1 < BLEED + EFFECTIVE_WIDTH and y1 < BLEED + EFFECTIVE_HEIGHT:
                c.line(x1, y1, x2, y2)
    
    # Decorative elements
    center_x = BLEED + EFFECTIVE_WIDTH / 2
    center_y = BLEED + EFFECTIVE_HEIGHT / 2
    
    # Starbursts
    draw_starburst(c, BLEED + 20*mm, BLEED + EFFECTIVE_HEIGHT - 20*mm, 15*mm,
                   COLOR_MAGENTA if is_color else black, is_bw=not is_color)
    draw_starburst(c, BLEED + EFFECTIVE_WIDTH - 20*mm, BLEED + 20*mm, 12*mm,
                   COLOR_CYAN if is_color else black, is_bw=not is_color)
    
    # Pixel hearts
    draw_pixel_heart(c, BLEED + 15*mm, BLEED + EFFECTIVE_HEIGHT - 30*mm, 8*mm,
                     COLOR_LIME if is_color else black, is_bw=not is_color)
    
    # Butterflies
    draw_butterfly_silhouette(c, BLEED + EFFECTIVE_WIDTH - 15*mm, 
                              BLEED + EFFECTIVE_HEIGHT - 25*mm, 10*mm, 8*mm,
                              COLOR_CYAN if is_color else black, is_bw=not is_color)
    
    # Glitter specks
    if is_color:
        draw_glitter_specks(c, BLEED, BLEED + EFFECTIVE_WIDTH, 
                           BLEED, BLEED + EFFECTIVE_HEIGHT, 30,
                           COLOR_LIME, is_bw=False)
    else:
        draw_glitter_specks(c, BLEED, BLEED + EFFECTIVE_WIDTH,
                           BLEED, BLEED + EFFECTIVE_HEIGHT, 40,
                           white, is_bw=True)
    
    # Scanlines overlay
    draw_scanlines(c, BLEED + 40*mm, BLEED + EFFECTIVE_HEIGHT - 40*mm,
                   BLEED + 10*mm, BLEED + EFFECTIVE_WIDTH - 10*mm,
                   COLOR_CYAN if is_color else HexColor('#808080'),
                   is_bw=not is_color)
    
    # CD reflections (decorative)
    draw_cd_reflection(c, BLEED + EFFECTIVE_WIDTH - 25*mm, BLEED + 30*mm,
                      8*mm, is_bw=not is_color)
    
    # Main QR Code (large, centered)
    main_qr_size_mm = 35  # 3.5cm
    main_qr_img = generate_qr_code(main_url, size_px=400)
    qr_buffer = io.BytesIO()
    main_qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    qr_x = center_x - (main_qr_size_mm * mm) / 2
    qr_y = center_y - (main_qr_size_mm * mm) / 2 + 10*mm  # Slightly below center
    
    # QR code frame
    frame_width = main_qr_size_mm * mm + 6*mm
    frame_x = qr_x - 3*mm
    frame_y = qr_y - 3*mm
    
    if is_color:
        c.setStrokeColor(COLOR_MAGENTA)
        c.setFillColor(white)
    else:
        c.setStrokeColor(black)
        c.setFillColor(white)
    c.setLineWidth(3 if is_color else 4)
    c.rect(frame_x, frame_y, frame_width, frame_width, fill=1, stroke=1)
    
    # Add decorative corner brackets (Y2K style)
    bracket_size = 5*mm
    bracket_thickness = 2 if is_color else 3
    c.setLineWidth(bracket_thickness)
    
    # Bottom-left bracket
    c.line(frame_x, frame_y, frame_x + bracket_size, frame_y)
    c.line(frame_x, frame_y, frame_x, frame_y + bracket_size)
    
    # Bottom-right bracket
    c.line(frame_x + frame_width - bracket_size, frame_y, frame_x + frame_width, frame_y)
    c.line(frame_x + frame_width, frame_y, frame_x + frame_width, frame_y + bracket_size)
    
    # Top-left bracket
    c.line(frame_x, frame_y + frame_width, frame_x + bracket_size, frame_y + frame_width)
    c.line(frame_x, frame_y + frame_width - bracket_size, frame_x, frame_y + frame_width)
    
    # Top-right bracket
    c.line(frame_x + frame_width - bracket_size, frame_y + frame_width, frame_x + frame_width, frame_y + frame_width)
    c.line(frame_x + frame_width, frame_y + frame_width - bracket_size, frame_x + frame_width, frame_y + frame_width)
    
    c.drawImage(ImageReader(qr_buffer), qr_x, qr_y, 
                width=main_qr_size_mm*mm, height=main_qr_size_mm*mm)
    
    # Smaller QR codes (optional)
    small_qr_size_mm = 20
    small_qr_y = BLEED + 25*mm
    
    if tip_url:
        tip_qr_img = generate_qr_code(tip_url, size_px=250)
        tip_buffer = io.BytesIO()
        tip_qr_img.save(tip_buffer, format='PNG')
        tip_buffer.seek(0)
        tip_qr_x = BLEED + 15*mm
        c.drawImage(ImageReader(tip_buffer), tip_qr_x, small_qr_y,
                    width=small_qr_size_mm*mm, height=small_qr_size_mm*mm)
        # Label
        c.setFillColor(COLOR_MAGENTA if is_color else black)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(tip_qr_x, small_qr_y - 5*mm, "TIP")
    
    if song_url:
        song_qr_img = generate_qr_code(song_url, size_px=250)
        song_buffer = io.BytesIO()
        song_qr_img.save(song_buffer, format='PNG')
        song_buffer.seek(0)
        song_qr_x = BLEED + EFFECTIVE_WIDTH - 15*mm - small_qr_size_mm*mm
        c.drawImage(ImageReader(song_buffer), song_qr_x, small_qr_y,
                    width=small_qr_size_mm*mm, height=small_qr_size_mm*mm)
        # Label
        c.setFillColor(COLOR_CYAN if is_color else black)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(song_qr_x, small_qr_y - 5*mm, "SONG")
    
    # Artist name (large, Y2K style)
    artist_y = BLEED + EFFECTIVE_HEIGHT - 20*mm
    c.setFont("Helvetica-Bold", 32)
    
    if is_color:
        # Chrome text effect with outline
        # Outer glow
        for offset in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
            c.setFillColor(COLOR_CYAN)
            c.drawString(center_x - c.stringWidth(artist_name, "Helvetica-Bold", 32) / 2 + offset[0],
                        artist_y + offset[1], artist_name)
        # Main text
        c.setFillColor(COLOR_MAGENTA)
        c.drawString(center_x - c.stringWidth(artist_name, "Helvetica-Bold", 32) / 2,
                    artist_y, artist_name)
    else:
        # Heavy outline effect for B&W
        text_width = c.stringWidth(artist_name, "Helvetica-Bold", 32)
        for offset in [(-2, -2), (-2, 0), (-2, 2), (0, -2), (0, 2), (2, -2), (2, 0), (2, 2)]:
            c.setFillColor(white)
            c.drawString(center_x - text_width / 2 + offset[0], artist_y + offset[1], artist_name)
        c.setFillColor(black)
        c.drawString(center_x - text_width / 2, artist_y, artist_name)
    
    # Headline
    headline = "REQUEST LINE ♪ tip or pick the next song!"
    headline_y = qr_y + main_qr_size_mm*mm + 15*mm
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(COLOR_MAGENTA if is_color else black)
    c.drawString(center_x - c.stringWidth(headline, "Helvetica-Bold", 14) / 2,
                headline_y, headline)
    
    # Subtext
    subtext = "scan with your phone ♡ no app needed"
    subtext_y = headline_y - 8*mm
    c.setFont("Helvetica", 10)
    c.setFillColor(COLOR_CYAN if is_color else black)
    c.drawString(center_x - c.stringWidth(subtext, "Helvetica", 10) / 2,
                subtext_y, subtext)
    
    # Payment handles at bottom
    payment_text = f"Venmo: {venmo_handle} | Cash App: {cashapp_handle}"
    payment_y = BLEED + 8*mm
    c.setFont("Helvetica", 7)
    c.setFillColor(black)
    c.drawString(center_x - c.stringWidth(payment_text, "Helvetica", 7) / 2,
                payment_y, payment_text)
    
    # B&W only: "Photocopy me" watermark
    if not is_color:
        c.setFillColor(HexColor('#D0D0D0'))
        c.setFont("Helvetica-Oblique", 8)
        watermark = "Photocopy me ♡"
        c.drawString(BLEED + 5*mm, BLEED + EFFECTIVE_HEIGHT - 10*mm,
                    watermark, charSpace=1)
    
    # Crop marks (at corners of effective area)
    crop_mark_length = 5*mm
    c.setStrokeColor(black)
    c.setLineWidth(0.5)
    
    # Bottom-left corner
    c.line(BLEED - crop_mark_length, BLEED, BLEED, BLEED)
    c.line(BLEED, BLEED - crop_mark_length, BLEED, BLEED)
    
    # Bottom-right corner
    c.line(BLEED + EFFECTIVE_WIDTH, BLEED - crop_mark_length, BLEED + EFFECTIVE_WIDTH, BLEED)
    c.line(BLEED + EFFECTIVE_WIDTH, BLEED, BLEED + EFFECTIVE_WIDTH + crop_mark_length, BLEED)
    
    # Top-left corner
    c.line(BLEED - crop_mark_length, BLEED + EFFECTIVE_HEIGHT, BLEED, BLEED + EFFECTIVE_HEIGHT)
    c.line(BLEED, BLEED + EFFECTIVE_HEIGHT, BLEED, BLEED + EFFECTIVE_HEIGHT + crop_mark_length)
    
    # Top-right corner
    c.line(BLEED + EFFECTIVE_WIDTH, BLEED + EFFECTIVE_HEIGHT, 
           BLEED + EFFECTIVE_WIDTH + crop_mark_length, BLEED + EFFECTIVE_HEIGHT)
    c.line(BLEED + EFFECTIVE_WIDTH, BLEED + EFFECTIVE_HEIGHT, 
           BLEED + EFFECTIVE_WIDTH, BLEED + EFFECTIVE_HEIGHT + crop_mark_length)
    
    c.save()
    print(f"✓ Generated: {output_filename}")


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description='Generate Y2K-inspired song request flyers')
    parser.add_argument('--artist', type=str, default=DEFAULT_ARTIST,
                       help='Artist/DJ name')
    parser.add_argument('--url', type=str, default=DEFAULT_MAIN_URL,
                       help='Main QR code URL')
    parser.add_argument('--tip-url', type=str, default=DEFAULT_TIP_URL,
                       help='Tip QR code URL (optional)')
    parser.add_argument('--song-url', type=str, default=DEFAULT_SONG_URL,
                       help='Song request QR code URL (optional)')
    parser.add_argument('--venmo', type=str, default=DEFAULT_VENMO,
                       help='Venmo handle')
    parser.add_argument('--cashapp', type=str, default=DEFAULT_CASHAPP,
                       help='Cash App handle')
    
    args = parser.parse_args()
    
    print("🎵 Generating Y2K-Inspired Song Request Flyers...")
    print(f"   Artist: {args.artist}")
    print(f"   Main URL: {args.url}")
    print()
    
    # Generate COLOR version
    generate_flyer(
        artist_name=args.artist,
        main_url=args.url,
        tip_url=args.tip_url,
        song_url=args.song_url,
        venmo_handle=args.venmo,
        cashapp_handle=args.cashapp,
        is_color=True,
        output_filename="Y2K_Request_Line_COLOR.pdf"
    )
    
    # Generate BLACK & WHITE version
    generate_flyer(
        artist_name=args.artist,
        main_url=args.url,
        tip_url=args.tip_url,
        song_url=args.song_url,
        venmo_handle=args.venmo,
        cashapp_handle=args.cashapp,
        is_color=False,
        output_filename="Y2K_Request_Line_BW.pdf"
    )
    
    print()
    print("✨ Both flyers generated successfully!")
    print("   - Y2K_Request_Line_COLOR.pdf (full color)")
    print("   - Y2K_Request_Line_BW.pdf (black & white)")


if __name__ == "__main__":
    main()

