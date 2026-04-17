/**
 * ExamTip — "Exam Tip" card with star icon
 * Props: { tip: string, category?: string }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const tip = props.tip || 'Remember this for the exam!';
    const category = props.category || 'Prelims & Mains';

    // Background
    ctx.fillStyle = '#0a0a23';
    ctx.fillRect(0, 0, w, h);

    // Star icon (animated scale)
    const scale = Math.min(progress * 3, 1);
    const cx = w / 2;
    const cy = h * 0.3;
    drawStar(ctx, cx, cy, 5, w * 0.05 * scale, w * 0.025 * scale, '#f0a500');

    // "EXAM TIP" label
    ctx.globalAlpha = Math.min(progress * 2, 1);
    ctx.fillStyle = '#f0a500';
    ctx.font = `bold ${Math.round(w * 0.035)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    ctx.fillText('EXAM TIP', cx, cy + w * 0.08);

    // Category
    ctx.fillStyle = '#888888';
    ctx.font = `${Math.round(w * 0.02)}px DejaVu Sans`;
    ctx.fillText(category.slice(0, 30), cx, cy + w * 0.12);

    // Tip text
    if (progress > 0.2) {
      ctx.globalAlpha = Math.min((progress - 0.2) * 3, 1);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.round(w * 0.028)}px DejaVu Sans`;
      wrapText(ctx, tip, cx, h * 0.58, w * 0.7, w * 0.04);
    }

    ctx.globalAlpha = 1;
  }
};

function drawStar(ctx, cx, cy, spikes, outerR, innerR, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '', currentY = y;
  for (const w of words) {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = w + ' ';
      currentY += lineH;
    } else line = test;
  }
  ctx.fillText(line.trim(), x, currentY);
}
