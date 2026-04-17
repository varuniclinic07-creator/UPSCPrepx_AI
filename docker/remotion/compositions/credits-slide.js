/**
 * CreditsSlide — End credits with attribution
 * Props: { title?: string, credits?: string[] }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const title = props.title || 'UPSC PrepX-AI';
    const credits = props.credits || ['Powered by AI', 'Made in India'];

    // Background
    ctx.fillStyle = '#0a0a23';
    ctx.fillRect(0, 0, w, h);

    // Scrolling credits effect
    const scrollY = h - progress * (h + credits.length * w * 0.06);

    // Title
    ctx.globalAlpha = Math.min(progress * 3, 1);
    ctx.fillStyle = '#e94560';
    ctx.font = `bold ${Math.round(w * 0.05)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 30), w / 2, h * 0.35);

    // Accent line
    ctx.fillStyle = '#e94560';
    ctx.fillRect(w * 0.3, h * 0.4, w * 0.4, 2);

    // Credit lines
    for (let i = 0; i < credits.length; i++) {
      const y = h * 0.5 + i * (w * 0.05);
      const alpha = Math.min(Math.max(progress * 3 - 0.5, 0), 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#cccccc';
      ctx.font = `${Math.round(w * 0.022)}px DejaVu Sans`;
      ctx.fillText(String(credits[i]).slice(0, 50), w / 2, y);
    }

    ctx.globalAlpha = 1;
  }
};
