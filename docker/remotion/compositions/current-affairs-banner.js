/**
 * CurrentAffairsBanner — Breaking news / CA ticker style
 * Props: { headline: string, date?: string, category?: string, summary?: string }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const headline = props.headline || 'Current Affairs Update';
    const date = props.date || '';
    const category = props.category || 'NATIONAL';
    const summary = props.summary || '';

    // Background
    ctx.fillStyle = '#0a0a23';
    ctx.fillRect(0, 0, w, h);

    // Breaking news banner (top bar)
    ctx.fillStyle = '#e94560';
    ctx.fillRect(0, 0, w, h * 0.08);

    // "CURRENT AFFAIRS" label
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(w * 0.022)}px DejaVu Sans`;
    ctx.textAlign = 'left';
    ctx.fillText('CURRENT AFFAIRS', w * 0.03, h * 0.055);

    // Date
    if (date) {
      ctx.textAlign = 'right';
      ctx.fillText(date.slice(0, 20), w * 0.97, h * 0.055);
    }

    // Category badge
    ctx.globalAlpha = Math.min(progress * 3, 1);
    const catW = ctx.measureText(category).width + 20;
    ctx.fillStyle = '#f0a500';
    ctx.fillRect(w * 0.03, h * 0.12, catW, h * 0.05);
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${Math.round(w * 0.016)}px DejaVu Sans`;
    ctx.textAlign = 'left';
    ctx.fillText(category.slice(0, 15).toUpperCase(), w * 0.03 + 10, h * 0.155);

    // Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(w * 0.035)}px DejaVu Sans`;
    ctx.textAlign = 'left';
    const maxHeadlineW = w * 0.9;
    wrapText(ctx, headline, w * 0.03, h * 0.28, maxHeadlineW, w * 0.05);

    // Summary
    if (summary && progress > 0.3) {
      ctx.globalAlpha = Math.min((progress - 0.3) * 3, 1);
      ctx.fillStyle = '#cccccc';
      ctx.font = `${Math.round(w * 0.022)}px DejaVu Sans`;
      wrapText(ctx, summary, w * 0.03, h * 0.5, maxHeadlineW, w * 0.035);
    }

    // Ticker bar at bottom
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, h * 0.92, w, h * 0.08);

    // Scrolling ticker text
    const tickerText = `  ${headline}  |  ${category}  |  ${date}  `;
    const tickerWidth = ctx.measureText(tickerText).width;
    const tickerX = w - (progress * (w + tickerWidth));
    ctx.fillStyle = '#f0a500';
    ctx.font = `${Math.round(w * 0.018)}px DejaVu Sans`;
    ctx.textAlign = 'left';
    ctx.fillText(tickerText, tickerX, h * 0.965);
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
