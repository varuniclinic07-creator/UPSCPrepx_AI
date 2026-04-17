/**
 * SubtitleCard — Section headers with slide transition
 * Props: { title: string, sectionNumber?: number }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const title = props.title || 'Section';
    const num = props.sectionNumber || '';

    // Background
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, w, h);

    // Slide-in rectangle
    const slideX = -w + w * 2 * Math.min(progress * 2, 1);
    ctx.fillStyle = '#e94560';
    ctx.fillRect(slideX, h * 0.35, w, h * 0.3);

    // Section number
    if (num) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(w * 0.08)}px DejaVu Sans`;
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(progress * 4, 1);
      ctx.fillText(String(num), w / 2, h * 0.47);
    }

    // Title
    ctx.globalAlpha = Math.min(Math.max(progress - 0.2, 0) * 3, 1);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(w * 0.04)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 50), w / 2, h * 0.57);

    ctx.globalAlpha = 1;
  }
};
