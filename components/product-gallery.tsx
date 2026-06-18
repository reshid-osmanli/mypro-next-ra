"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

type ProductGalleryProps = {
  title: string;
  images: string[];
};

export function ProductGallery({ title, images }: ProductGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <>
      <div className="mt-8 border-t border-pearl-200 pt-8">
        <h2 className="text-xl font-black text-zinc-950 flex items-center gap-2">
          <ImageIcon size={20} className="text-qatar-700" />
          معاينة محتوى الملف
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.slice(0, 4).map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                setIsOpen(true);
              }}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-pearl-200 bg-white transition hover:ring-2 hover:ring-qatar-500"
            >
              <img src={img} alt={`${title} preview ${i + 1}`} className="h-full w-full object-cover" />
              {i === 3 && images.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-black text-white">
                  +{images.length - 4}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X size={24} />
            </button>
            
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 z-50 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-10"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 z-50 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-10"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg shadow-2xl">
              {/* Watermark layer overlay for extra protection in preview */}
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-20">
                <div className="rotate-[-30deg] text-6xl font-black tracking-widest text-white drop-shadow-lg">
                  K U T U B I
                </div>
              </div>
              <img
                src={images[currentIndex]}
                alt={`${title} preview ${currentIndex + 1}`}
                className="max-h-[90vh] w-auto object-contain"
              />
            </div>
            
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm font-bold text-white">
              {currentIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
