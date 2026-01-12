'use client';
import { cn } from "@/utils/cn";
import React, { useEffect, useRef } from "react";

interface Firefly {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  opacity: number;
  targetOpacity: number;
  pulseSpeed: number;
}

interface FirefliesProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  speed?: number;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const Fireflies = ({
  className,
  count = 50,
  speed = 0.5,
  size = 2,
  color = '#fcba00',
  backgroundColor = '#000000',
  ...props
}: FirefliesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const firefliesRef = useRef<Firefly[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Initialize fireflies
    const initFireflies = () => {
      firefliesRef.current = [];
      for (let i = 0; i < count; i++) {
        firefliesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: size + Math.random() * size,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          opacity: Math.random(),
          targetOpacity: Math.random(),
          pulseSpeed: 0.01 + Math.random() * 0.02,
        });
      }
    };

    initFireflies();

    const animate = () => {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      firefliesRef.current.forEach((firefly) => {
        // Update position
        firefly.x += firefly.vx;
        firefly.y += firefly.vy;

        // Wrap around edges
        if (firefly.x < 0) firefly.x = canvas.width;
        if (firefly.x > canvas.width) firefly.x = 0;
        if (firefly.y < 0) firefly.y = canvas.height;
        if (firefly.y > canvas.height) firefly.y = 0;

        // Pulse opacity
        if (Math.abs(firefly.opacity - firefly.targetOpacity) < 0.01) {
          firefly.targetOpacity = Math.random();
        }
        firefly.opacity += (firefly.targetOpacity - firefly.opacity) * firefly.pulseSpeed;

        // Draw firefly with glow
        const gradient = ctx.createRadialGradient(
          firefly.x,
          firefly.y,
          0,
          firefly.x,
          firefly.y,
          firefly.radius * 3
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color + '80');
        gradient.addColorStop(1, color + '00');

        ctx.save();
        ctx.globalAlpha = firefly.opacity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(firefly.x, firefly.y, firefly.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw bright center
        ctx.globalAlpha = firefly.opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(firefly.x, firefly.y, firefly.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [count, speed, size, color, backgroundColor]);

  return (
    <div className={cn("relative h-full w-full", className)} {...(props as any)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: backgroundColor }}
      />
    </div>
  );
};

export default Fireflies;
