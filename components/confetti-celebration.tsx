"use client";

// ============================================================================
// components/confetti-celebration.tsx — One-time celebration on /thank-you
// ----------------------------------------------------------------------------
// New file: /components/confetti-celebration.tsx
// Uses sessionStorage so refresh does NOT replay.
// ============================================================================

import { useEffect, useRef } from "react";

export function ConfettiCelebration({ fire = true }: { fire?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!fire) return;
    if (firedRef.current) return;
    if (typeof window === "undefined") return;

    const seen = sessionStorage.getItem("kutubi_confetti_fired");
    if (seen) {
      firedRef.current = true;
      return;
    }
    firedRef.current = true;
    sessionStorage.setItem("kutubi_confetti_fired", "1");

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();

    const colors = ["#8a1538", "#d89b32", "#0f766e", "#f6c2d2", "#fff8e8"];
    const confettiCount = 140;
    const confetti = Array.from({ length: confettiCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.5,
      r: Math.random() * 6 + 4,
      d: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      tilt: Math.random() * 10 - 5,
      tiltAngle: Math.random() * Math.PI,
      tiltAngleIncremental: Math.random() * 0.07 + 0.05,
    }));

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      confetti.forEach((p) => {
        ctx.beginPath();
        ctx.lineWidth = p.r / 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.tilt = Math.sin(p.tiltAngle) * 15;

        if (p.y > window.innerHeight) {
          p.x = Math.random() * window.innerWidth;
          p.y = -10;
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const stop = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }, 5500);

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(stop);
      window.removeEventListener("resize", handleResize);
    };
  }, [fire]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
