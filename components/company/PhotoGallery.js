'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Minimal blur placeholder (tiny gray) for instant load
const BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQADAPwA/9k=';

const GRID_SIZE = 720;
const MODAL_SIZE = 1280;
const THUMB_SIZE = 180;

export default function PhotoGallery({ photos }) {
  const router = useRouter();
  const { photoId } = router.query;
  const lastViewedRef = useRef(null);
  const index = photoId ? photos.findIndex((p) => String(p.id) === String(photoId)) : -1;
  const currentPhoto = index >= 0 ? photos[index] : null;

  // Restore scroll to last viewed photo when closing modal
  useEffect(() => {
    if (!photoId && lastViewedRef.current) {
      lastViewedRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
      lastViewedRef.current = null;
    }
  }, [photoId]);

  const closeModal = () => {
    if (currentPhoto) lastViewedRef.current = document.querySelector(`[data-photo-id="${currentPhoto.id}"]`);
    router.push('/gallery', undefined, { shallow: true });
  };

  const goTo = (newIndex) => {
    const id = photos[newIndex]?.id;
    if (id != null) router.push(`/gallery?photoId=${id}`, undefined, { shallow: true });
  };

  const goPrev = () => {
    if (index <= 0) return;
    goTo(index - 1);
  };

  const goNext = () => {
    if (index >= photos.length - 1) return;
    goTo(index + 1);
  };

  const openPhoto = (photo) => {
    router.push(`/gallery?photoId=${photo.id}`, undefined, { shallow: true, scroll: false });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft' && index > 0) goTo(index - 1);
      if (e.key === 'ArrowRight' && index < photos.length - 1) goTo(index + 1);
    };
    if (currentPhoto) {
      window.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [currentPhoto, index, photos.length]);

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            data-photo-id={photo.id}
            onClick={() => openPhoto(photo)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPhoto(photo);
              }
            }}
            className="group relative block w-full aspect-[3/2] overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 touch-manipulation cursor-pointer text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative w-full h-full"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={GRID_SIZE}
                height={GRID_SIZE * (2 / 3)}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover transition duration-300 group-hover:brightness-110 pointer-events-none"
                style={{ transform: 'translate3d(0, 0, 0)' }}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading={i < 4 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none rounded-lg" />
            </motion.div>
          </button>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {currentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] flex flex-col bg-black"
            role="dialog"
            aria-modal="true"
            aria-label="Photo gallery lightbox"
            onClick={closeModal}
          >
            {/* Content — stop propagation so clicking image/controls doesn't close */}
            <div
              className="relative z-10 flex flex-col flex-1 min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/80 text-white shrink-0">
              <span className="text-sm md:text-base text-zinc-300">
                {index + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                aria-label="Close gallery"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main image area */}
            <div className="relative flex-1 flex items-center justify-center min-h-0 p-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={index <= 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>

              <motion.div
                key={currentPhoto.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="relative max-w-full max-h-full flex items-center justify-center"
              >
                <Image
                  src={currentPhoto.src}
                  alt={currentPhoto.alt}
                  width={MODAL_SIZE}
                  height={MODAL_SIZE * (2 / 3)}
                  className="max-h-[70vh] w-auto object-contain rounded-lg"
                  priority
                  sizes="(max-width: 1280px) 100vw, 1280px"
                />
              </motion.div>

              <button
                type="button"
                onClick={goNext}
                disabled={index >= photos.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                aria-label="Next photo"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>

            {/* Caption */}
            {currentPhoto.caption && (
              <p className="text-center text-sm text-zinc-400 px-4 py-2 bg-black/80 shrink-0">
                {currentPhoto.caption}
              </p>
            )}

            {/* Thumbnail strip */}
            <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-black/80 shrink-0 scrollbar-thin">
              {photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => goTo(photos.indexOf(p))}
                  className={`relative shrink-0 w-16 h-11 rounded overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-400 ring-offset-2 ring-offset-black transition-opacity ${
                    p.id === currentPhoto.id ? 'opacity-100 ring-2 ring-amber-400' : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  <Image
                    src={p.src}
                    alt=""
                    width={THUMB_SIZE}
                    height={THUMB_SIZE * (2 / 3)}
                    className="object-cover w-full h-full"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
