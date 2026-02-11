'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ROTATE_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 50;

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
  const itemsLengthRef = useRef(items.length);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    itemsLengthRef.current = items.length;
  }, [items.length]);

  const goTo = useCallback((nextIndex) => {
    if (items.length <= 1) return;
    setIndex((nextIndex + items.length) % items.length);
  }, [items.length]);

  const goPrev = useCallback(() => goTo(index - 1), [index, goTo]);
  const goNext = useCallback(() => goTo(index + 1), [index, goTo]);

  // Auto-advance on desktop and mobile (ref avoids stale closure)
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => goNext(), ROTATE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [items.length, goNext]);

  // Preload next/prev images so transition never shows placeholder or broken icon
  useEffect(() => {
    if (items.length <= 1 || typeof window === 'undefined') return;
    const nextIdx = (index + 1) % items.length;
    const prevIdx = (index - 1 + items.length) % items.length;
    [items[nextIdx], items[prevIdx]].forEach((item) => {
      if (!item?.src) return;
      const img = new window.Image();
      img.src = item.src.startsWith('/') ? window.location.origin + item.src : item.src;
    });
  }, [index, items]);

  const onTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) >= SWIPE_THRESHOLD_PX) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };
  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

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
      className={`relative h-[320px] overflow-hidden md:h-[420px] touch-pan-y ${className}`}
      aria-label="Hero carousel"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Carousel background — solid dark behind so no broken/placeholder icon ever shows */}
      <div className="absolute inset-0 z-0 bg-zinc-900">
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
              unoptimized={current.src.startsWith('http') && current.src.includes('supabase')}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop: prev/next click buttons — z-10 so they sit above the text overlay and receive clicks */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-transparent md:left-4 md:p-2.5"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-transparent md:right-4 md:p-2.5"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </>
      )}

      {/* Dark gradient overlay — dark at bottom for text readability; top stays lighter so more photo shows on mobile */}
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/50 to-transparent md:from-black/90 md:via-black/50 md:to-black/40 pointer-events-none"
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
