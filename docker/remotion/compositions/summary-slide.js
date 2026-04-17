/**
 * SummarySlide — Key takeaways summary
 * Props: { title?: string, takeaways: string[] }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const title = props.title || 'Key Takeaways';
    const takeaways = props.takeaways || [];

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#16213e');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Header
    ctx.globalAlpha = Math.min(progress * 3, 1);
    ctx.fillStyle = '#f0a500';
    ctx.font = `bold ${Math.round(w * 0.035)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 40), w / 2, h * 0.12);

    // Checkmark items
    const n = Math.min(takeaways.length, 6);
    for (let i = 0; i < n; i++) {
      const itemP = Math.min(Math.max(progress * (n + 1) - i, 0), 1);
      if (itemP <= 0) continue;

      const y = h * 0.22 + i * (h * 0.11);
      ctx.globalAlpha = itemP;

      // Checkmark
      ctx.fillStyle = '#40c057';
      ctx.font = `${Math.round(w * 0.025)}px DejaVu Sans`;
      ctx.textAlign = 'left';
      ctx.fillText('\u2713', w * 0.1, y);

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.round(w * 0.023)}px DejaVu Sans`;
      ctx.fillText(String(takeaways[i]).slice(0, 60), w * 0.15, y);
    }

    ctx.globalAlpha = 1;
  }
};
