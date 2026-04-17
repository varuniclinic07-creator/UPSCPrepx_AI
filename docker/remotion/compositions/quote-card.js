/**
 * QuoteCard — Notable quote with attribution
 * Props: { quote: string, author: string, context?: string }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const quote = props.quote || 'The price of freedom is eternal vigilance.';
    const author = props.author || '';
    const context = props.context || '';

    // Background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Large opening quote mark
    ctx.globalAlpha = Math.min(progress * 2, 0.3);
    ctx.fillStyle = '#e94560';
    ctx.font = `${Math.round(w * 0.2)}px DejaVu Sans`;
    ctx.textAlign = 'left';
    ctx.fillText('\u201C', w * 0.08, h * 0.35);

    // Quote text
    ctx.globalAlpha = Math.min(progress * 2.5, 1);
    ctx.fillStyle = '#ffffff';
    ctx.font = `italic ${Math.round(w * 0.03)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    wrapText(ctx, quote, w / 2, h * 0.4, w * 0.7, w * 0.045);

    // Author
    if (author && progress > 0.4) {
      ctx.globalAlpha = Math.min((progress - 0.4) * 3, 1);
      ctx.fillStyle = '#f0a500';
      ctx.font = `bold ${Math.round(w * 0.022)}px DejaVu Sans`;
      ctx.fillText(`\u2014 ${author.slice(0, 40)}`, w / 2, h * 0.7);
    }

    // Context
    if (context && progress > 0.6) {
      ctx.globalAlpha = Math.min((progress - 0.6) * 4, 1);
      ctx.fillStyle = '#888888';
      ctx.font = `${Math.round(w * 0.018)}px DejaVu Sans`;
      ctx.fillText(context.slice(0, 60), w / 2, h * 0.78);
    }

    ctx.globalAlpha = 1;
  }
};

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
