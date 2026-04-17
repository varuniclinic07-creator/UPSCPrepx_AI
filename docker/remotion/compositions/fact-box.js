/**
 * FactBox — Key fact with icon and highlight border
 * Props: { fact: string, source?: string, icon?: string }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const fact = props.fact || 'Key Fact';
    const source = props.source || '';

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Animated border box
    const boxW = w * 0.7;
    const boxH = h * 0.4;
    const boxX = (w - boxW) / 2;
    const boxY = (h - boxH) / 2;
    const borderProgress = Math.min(progress * 2, 1);

    ctx.strokeStyle = '#f0a500';
    ctx.lineWidth = 3;
    ctx.setLineDash([boxW * borderProgress, boxW]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.setLineDash([]);

    // "FACT" label
    ctx.globalAlpha = Math.min(progress * 3, 1);
    ctx.fillStyle = '#f0a500';
    ctx.font = `bold ${Math.round(w * 0.025)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    ctx.fillText('KEY FACT', w / 2, boxY + h * 0.05);

    // Fact text
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.round(w * 0.03)}px DejaVu Sans`;
    wrapText(ctx, fact, w / 2, boxY + boxH * 0.4, boxW * 0.85, w * 0.04);

    // Source
    if (source && progress > 0.5) {
      ctx.globalAlpha = Math.min((progress - 0.5) * 4, 1);
      ctx.fillStyle = '#888888';
      ctx.font = `italic ${Math.round(w * 0.018)}px DejaVu Sans`;
      ctx.fillText(`Source: ${source.slice(0, 50)}`, w / 2, boxY + boxH - h * 0.03);
    }

    ctx.globalAlpha = 1;
  }
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const testLine = line + word + ' ';
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}
