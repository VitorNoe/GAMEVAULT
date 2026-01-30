import React, { useEffect, useRef, memo } from 'react';

interface AuroraBackgroundProps {
  className?: string;
}

/**
 * Aurora Background - PS3 XMB Style
 * Baseado no design Frutiger Aurora com ondas animadas via Canvas 2D
 */
export const AuroraBackground: React.FC<AuroraBackgroundProps> = memo(({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let w: number, h: number, centerX: number, centerY: number;

    // Resize handler
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(dpr, dpr);
      centerX = w / 2;
      centerY = h / 2;
      mouseRef.current.x = centerX;
      mouseRef.current.y = centerY;
      mouseRef.current.targetX = centerX;
      mouseRef.current.targetY = centerY;
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    document.addEventListener('mousemove', handleMouseMove);

    // Particle system
    class Particle {
      x: number = 0;
      y: number = 0;
      baseSize: number = 0;
      size: number = 0;
      speedX: number = 0;
      speedY: number = 0;
      life: number = 0;
      lifeSpeed: number = 0;
      hue: number = 0;
      brightness: number = 0;
      pulseOffset: number = 0;

      constructor() {
        this.init();
      }

      init() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.baseSize = Math.random() * 2 + 0.5;
        this.size = this.baseSize;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.life = Math.random();
        this.lifeSpeed = Math.random() * 0.002 + 0.001;
        this.hue = Math.random() * 60 + 220;
        this.brightness = Math.random() * 40 + 60;
        this.pulseOffset = Math.random() * Math.PI * 2;
      }

      update(time: number) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.x += Math.sin(time * 0.001 + this.pulseOffset) * 0.08;
        this.y += Math.cos(time * 0.001 + this.pulseOffset) * 0.08;
        this.life += this.lifeSpeed;
        if (this.life > 1) this.life = 0;
        this.size = this.baseSize + Math.sin(this.life * Math.PI * 2) * 0.4;

        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (1 - dist / 150) * 0.3;
          this.x -= (dx / dist) * force * 1.5;
          this.y -= (dy / dist) * force * 1.5;
        }

        if (this.x < -30 || this.x > w + 30 || this.y < -30 || this.y > h + 30) {
          this.init();
        }
      }

      draw(context: CanvasRenderingContext2D) {
        const opacity = Math.sin(this.life * Math.PI) * 0.7 + 0.2;
        const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, ${this.brightness}%, ${opacity * 0.5})`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, 100%, ${this.brightness}%, ${opacity * 0.15})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 100%, ${this.brightness}%, 0)`);
        context.fillStyle = gradient;
        context.fillRect(this.x - this.size * 3, this.y - this.size * 3, this.size * 6, this.size * 6);
        context.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
        context.beginPath();
        context.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        context.fill();
      }
    }

    // Wave configuration - PS3 XMB style
    const waves = [
      { color1: '#1E3A8A', color2: '#7C3AED', offset: 0, speed: 0.00006, amplitude: 80, frequency: 0.0008, alpha: 0.12, layer: 0.3 },
      { color1: '#3B82F6', color2: '#8B5CF6', offset: Math.PI * 0.4, speed: 0.0001, amplitude: 100, frequency: 0.001, alpha: 0.1, layer: 0.4 },
      { color1: '#60A5FA', color2: '#A78BFA', offset: Math.PI * 0.8, speed: 0.00008, amplitude: 120, frequency: 0.0007, alpha: 0.09, layer: 0.5 },
      { color1: '#2563EB', color2: '#9333EA', offset: Math.PI * 1.2, speed: 0.00012, amplitude: 90, frequency: 0.0012, alpha: 0.11, layer: 0.35 },
      { color1: '#1D4ED8', color2: '#7E22CE', offset: Math.PI * 1.6, speed: 0.00007, amplitude: 110, frequency: 0.0009, alpha: 0.08, layer: 0.45 },
      { color1: '#4F46E5', color2: '#6D28D9', offset: Math.PI * 2, speed: 0.00015, amplitude: 70, frequency: 0.0015, alpha: 0.13, layer: 0.25 },
    ];

    // Stars background
    class Star {
      x: number;
      y: number;
      size: number;
      alpha: number;
      twinkleSpeed: number;
      twinkleOffset: number;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 1.2;
        this.alpha = Math.random() * 0.4 + 0.15;
        this.twinkleSpeed = Math.random() * 0.015 + 0.008;
        this.twinkleOffset = Math.random() * Math.PI * 2;
      }

      draw(context: CanvasRenderingContext2D, time: number) {
        const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.3 + 0.7;
        context.fillStyle = `rgba(255, 255, 255, ${this.alpha * twinkle})`;
        context.fillRect(this.x, this.y, this.size, this.size);
      }
    }

    // Create particles and stars
    const particles: Particle[] = [];
    const stars: Star[] = [];
    for (let i = 0; i < 80; i++) particles.push(new Particle());
    for (let i = 0; i < 150; i++) stars.push(new Star());

    // Draw wave function
    const drawWave = (wave: typeof waves[0], t: number) => {
      const yCenter = h * wave.layer;
      const gradient = ctx.createLinearGradient(0, yCenter - 200, w, yCenter + 200);
      gradient.addColorStop(0, wave.color1 + '40');
      gradient.addColorStop(0.25, wave.color2 + '60');
      gradient.addColorStop(0.5, wave.color1 + '80');
      gradient.addColorStop(0.75, wave.color2 + '60');
      gradient.addColorStop(1, wave.color1 + '40');

      ctx.fillStyle = gradient;
      ctx.globalAlpha = wave.alpha;

      // Bottom wave
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const y = yCenter +
          Math.sin(x * wave.frequency + t + wave.offset) * wave.amplitude +
          Math.sin(x * wave.frequency * 0.5 + t * 0.6 + wave.offset) * (wave.amplitude * 0.5) +
          Math.cos(x * wave.frequency * 1.5 + t * 0.4) * (wave.amplitude * 0.3) +
          Math.sin(x * wave.frequency * 0.25 + t * 0.8) * (wave.amplitude * 0.2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Top wave (reflected)
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const y = yCenter -
          Math.sin(x * wave.frequency + t + wave.offset + Math.PI) * wave.amplitude * 0.6 -
          Math.sin(x * wave.frequency * 0.5 + t * 0.6) * (wave.amplitude * 0.35) -
          Math.cos(x * wave.frequency * 1.5 + t * 0.4 + Math.PI) * (wave.amplitude * 0.2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(w, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;
    };

    // Animation loop
    const animate = () => {
      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Background gradient
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(w, h) * 0.8);
      bgGradient.addColorStop(0, '#0f0f1e');
      bgGradient.addColorStop(0.3, '#0a0a15');
      bgGradient.addColorStop(0.7, '#050508');
      bgGradient.addColorStop(1, '#000000');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, w, h);

      // Draw stars
      stars.forEach(star => star.draw(ctx, timeRef.current));

      // Draw waves sorted by layer
      const sortedWaves = [...waves].sort((a, b) => b.layer - a.layer);
      sortedWaves.forEach(wave => drawWave(wave, timeRef.current * wave.speed * 100));

      // Update and draw particles
      particles.forEach(particle => {
        particle.update(timeRef.current);
        particle.draw(ctx);
      });

      timeRef.current++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className={`aurora-wrapper ${className}`}>
      <canvas ref={canvasRef} className="aurora-canvas" />
      <div className="aurora-center-light" />
      <div className="aurora-overlay" />

      <style>{`
        .aurora-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
        }
        
        .aurora-canvas {
          display: block;
          width: 100%;
          height: 100%;
          background: #000;
        }
        
        .aurora-center-light {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120%;
          height: 120%;
          background: radial-gradient(ellipse at center,
            rgba(138,43,226,0.15) 0%,
            rgba(65,105,225,0.1) 25%,
            rgba(138,43,226,0.05) 50%,
            transparent 70%);
          animation: auroraPulse 8s ease-in-out infinite;
        }
        
        .aurora-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
        }
        
        @keyframes auroraPulse {
          0%, 100% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
});

AuroraBackground.displayName = 'AuroraBackground';

export default AuroraBackground;
