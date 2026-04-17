/**
 * CompareView — Before/after or A vs B comparison
 * Props: { titleA: string, titleB: string, descA: string, descB: string, verdict?: string }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const titleA = props.titleA || 'Before';
    const titleB = props.titleB || 'After';
    const descA = props.descA || '';
    const descB = props.descB || '';
    const verdict = props.verdict || '';

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // "VS" center
    ctx.globalAlpha = Math.min(progress * 4, 1);
    ctx.fillStyle = '#e94560';
    ctx.font = `bold ${Math.round(w * 0.06)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    ctx.fillText('VS', w / 2, h / 2);

    // Left side (A) — slides in from left
    const leftX = Math.min(progress * 2, 1) * w * 0.25;
    ctx.globalAlpha = Math.min(progress * 2, 1);
    ctx.fillStyle = '#f0a500';
    ctx.font = `bold ${Math.round(w * 0.03)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    ctx.fillText(titleA.slice(0, 20), leftX, h * 0.25);
    ctx.fillStyle = '#cccccc';
    ctx.font = `${Math.round(w * 0.02)}px DejaVu Sans`;
    wrapText(ctx, descA, leftX, h * 0.35, w * 0.35, w * 0.03);

    // Right side (B) — slides in from right
    const rightX = w - Math.min(progress * 2, 1) * w * 0.25;
    ctx.fillStyle = '#40c057';
    ctx.font = `bold ${Math.round(w * 0.03)}px DejaVu Sans`;
    ctx.fillText(titleB.slice(0, 20), rightX, h * 0.25);
    ctx.fillStyle = '#cccccc';
    ctx.font = `${Math.round(w * 0.02)}px DejaVu Sans`;
    wrapText(ctx, descB, rightX, h * 0.35, w * 0.35, w * 0.03);

    // Verdict at bottom
    if (verdict && progress > 0.6) {
      ctx.globalAlpha = Math.min((progress - 0.6) * 4, 1);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(w * 0.025)}px DejaVu Sans`;
      ctx.fillText(verdict.slice(0, 60), w / 2, h * 0.85);
    }

    ctx.globalAlpha = 1;
  }
};

function wrapText(ctx, text, x, y, maxW, lineH) {
  if (!text) return;
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
