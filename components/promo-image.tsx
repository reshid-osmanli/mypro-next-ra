"use client";

import { motion } from "framer-motion";

export function PromoImage({
  imageUrl,
  motionEnabled,
  scale,
  position,
  rotation
}: {
  imageUrl: string;
  motionEnabled: string;
  scale: string;
  position: string;
  rotation: string;
}) {
  if (motionEnabled === "true") {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <motion.div
          className="absolute inset-0 z-10"
          animate={{
            y: [0, -10, 0],
            scale: [Number(scale || 1), Number(scale || 1) * 1.02, Number(scale || 1)],
            rotate: [Number(rotation || 0), Number(rotation || 0) + 2, Number(rotation || 0)]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            transformOrigin: position || "center",
            width: "100%",
            height: "100%",
            backgroundImage: `url(${imageUrl})`,
            backgroundPosition: position || "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain"
          }}
        />
      </div>
    );
  }

  if (imageUrl.match(/\.(mp4|webm|mov)(\?|$)/i)) {
    return <video src={imageUrl} className="h-full w-full object-cover" muted loop playsInline autoPlay />;
  }

  return <img src={imageUrl} alt="promo" className="h-full w-full object-cover" />;
}
