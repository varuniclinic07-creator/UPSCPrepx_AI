/**
 * TitleCard — Topic title with animated text entry
 * Props: { title: string, subtitle?: string, style?: string }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const title = props.title || 'UPSC PrepX-AI';
    const subtitle = props.subtitle || '';

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Accent line
    const lineWidth = w * Math.min(progress * 2, 1);
    ctx.fillStyle = '#e94560';
    ctx.fillRect((w - lineWidth) / 2, h * 0.4, lineWidth, 4);

    // Title text (fade in + slide up)
    const titleAlpha = Math.min(progress * 3, 1);
    const titleY = h * 0.5 + (1 - titleAlpha) * 30;
    ctx.globalAlpha = titleAlpha;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(w * 0.05)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 50), w / 2, titleY);

    // Subtitle
    if (subtitle && progress > 0.3) {
      const subAlpha = Math.min((progress - 0.3) * 3, 1);
      ctx.globalAlpha = subAlpha;
      ctx.fillStyle = '#a0a0a0';
      ctx.font = `${Math.round(w * 0.025)}px DejaVu Sans`;
      ctx.fillText(subtitle.slice(0, 80), w / 2, titleY + w * 0.06);
    }

    ctx.globalAlpha = 1;
  }
};
