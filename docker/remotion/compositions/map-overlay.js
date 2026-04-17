/**
 * MapOverlay — India map with data overlay (simplified geometric)
 * Props: { title: string, dataPoints: [{ label: string, value: string, x: number, y: number }] }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const title = props.title || 'India Map Data';
    const dataPoints = props.dataPoints || [
      { label: 'Delhi', value: '95%', x: 0.45, y: 0.3 },
      { label: 'Mumbai', value: '88%', x: 0.3, y: 0.55 },
      { label: 'Chennai', value: '82%', x: 0.5, y: 0.7 },
      { label: 'Kolkata', value: '79%', x: 0.65, y: 0.45 },
    ];

    // Background
    ctx.fillStyle = '#0a0a23';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.globalAlpha = Math.min(progress * 3, 1);
    ctx.fillStyle = '#f0a500';
    ctx.font = `bold ${Math.round(w * 0.03)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 40), w / 2, h * 0.08);

    // Simplified India shape (triangle approximation)
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#16213e';
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.12);
    ctx.lineTo(w * 0.25, h * 0.35);
    ctx.lineTo(w * 0.2, h * 0.55);
    ctx.lineTo(w * 0.35, h * 0.75);
    ctx.lineTo(w * 0.45, h * 0.9);
    ctx.lineTo(w * 0.55, h * 0.75);
    ctx.lineTo(w * 0.7, h * 0.55);
    ctx.lineTo(w * 0.65, h * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Data points
    for (let i = 0; i < Math.min(dataPoints.length, 8); i++) {
      const dp = dataPoints[i];
      const pointP = Math.min(Math.max(progress * (dataPoints.length + 2) - i, 0), 1);
      if (pointP <= 0) continue;

      const px = (dp.x || 0.5) * w;
      const py = (dp.y || 0.5) * h;

      ctx.globalAlpha = pointP;

      // Pulse dot
      ctx.fillStyle = '#e94560';
      ctx.beginPath();
      ctx.arc(px, py, 6 + Math.sin(progress * 10 + i) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(w * 0.018)}px DejaVu Sans`;
      ctx.textAlign = 'left';
      ctx.fillText(`${dp.label || ''}: ${dp.value || ''}`, px + 12, py + 5);
    }

    ctx.globalAlpha = 1;
  }
};
