import { useEffect, useRef, useState } from 'react';
import './RiskGauge.css';

export default function RiskGauge({ score = 0, size = 180 }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    let start = animatedScore;
    const end = score;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(start + (end - start) * eased);
      setAnimatedScore(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 18;
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const scoreAngle = startAngle + (endAngle - startAngle) * (animatedScore / 100);

    // bg arc
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(75, 85, 130, 0.25)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // score arc
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    if (animatedScore < 40) {
      gradient.addColorStop(0, '#22c55e');
      gradient.addColorStop(1, '#4ade80');
    } else if (animatedScore < 70) {
      gradient.addColorStop(0, '#f59e0b');
      gradient.addColorStop(1, '#fbbf24');
    } else {
      gradient.addColorStop(0, '#ef4444');
      gradient.addColorStop(1, '#f87171');
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, scoreAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // glow
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, scoreAngle);
    ctx.strokeStyle = animatedScore >= 70 ? 'rgba(239,68,68,0.2)' : animatedScore >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)';
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.stroke();

  }, [animatedScore, size]);

  const level = animatedScore < 40 ? 'LOW' : animatedScore < 70 ? 'MEDIUM' : 'HIGH';
  const levelLabel = animatedScore < 40 ? 'Low Risk' : animatedScore < 70 ? 'Medium Risk' : 'High Risk';
  const color = animatedScore < 40 ? '#4ade80' : animatedScore < 70 ? '#fbbf24' : '#f87171';

  return (
    <div className="risk-gauge" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <div className="risk-gauge-center">
        <span className="risk-gauge-score" style={{ color }}>{animatedScore}</span>
        <span className="risk-gauge-label" style={{ color }}>{levelLabel}</span>
      </div>
    </div>
  );
}
