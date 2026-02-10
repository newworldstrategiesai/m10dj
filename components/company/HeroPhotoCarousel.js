'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQADAPwA/9k=';

const ROTATE_INTERVAL_MS = 5000;

/**
 * Hero header with photo carousel, dark gradient overlay, and overlaid title/subtitle.
 * Same appearance in light and dark mode (dark overlay + white text).
 * @param {Object} props
 * @param {Array<{ id: string, src: string, alt: string }>} props.photos - Same shape as gallery photos
 * @param {string} props.title - Main heading (e.g. "Photo Gallery")
 * @param {string} [props.subtitle] - Optional subheading (e.g. "M10 DJ Company")
 * @param {string} [props.description] - Optional short line below subtitle
 * @param {string} [props.className] - Optional class for the outer section
 */
export default function HeroPhotoCarousel({
  photos,
  title,
  subtitle,
  description,
  className = '',
}) {
  const [index, setIndex] = useState(0);
  const items = Array.isArray(photos) && photos.length > 0 ? photos : [];

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <section
        className={`relative flex min-h-[280px] items-center justify-center bg-zinc-900 ${className}`}
      >
        <div className="section-container text-center">
          <h1 className="text-3xl font-bold text-white md:text-4xl">{title || 'Gallery'}</h1>
          {subtitle && <p className="mt-2 text-lg text-amber-400">{subtitle}</p>}
          {description && <p className="mt-2 text-sm text-white/80">{description}</p>}
        </div>
      </section>
    );
  }

  const current = items[index];

  return (
    <section
      className={`relative h-[320px] overflow-hidden md:h-[420px] ${className}`}
      aria-label="Hero carousel"
    >
      {/* Carousel background images — explicit height so Next/Image fill has a container */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative h-full w-full"
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              className="object-cover"
              sizes="100vw"
              priority={index === 0}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              unoptimized={current.src.startsWith('http') && current.src.includes('supabase')}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dark gradient overlay — dark at bottom for text readability; top stays lighter so more photo shows on mobile */}
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/50 to-transparent md:from-black/90 md:via-black/50 md:to-black/40"
        aria-hidden
      />

      {/* Overlaid text — compact on mobile, more padding on desktop */}
      <div className="relative z-[2] flex h-full flex-col justify-end pb-6 pt-16 md:py-12 md:pb-16">
        <div className="section-container">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] md:text-5xl md:drop-shadow-lg lg:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm font-semibold text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] md:mt-2 md:text-xl md:drop-shadow">
              {subtitle}
            </p>
          )}
          {description && (
            <p className="mt-1.5 line-clamp-2 max-w-2xl text-xs text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] md:mt-3 md:line-clamp-none md:text-lg md:text-white/90 md:drop-shadow">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Optional: dot indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 md:bottom-6">
          {items.map((_, i) => (
            <button
              key={items[i].id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-transparent ${
                i === index ? 'bg-amber-400 w-6' : 'bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
