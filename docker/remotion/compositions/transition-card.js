/**
 * TransitionCard — Section transition with gradient wipe
 * Props: { text?: string }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const text = props.text || '';

    // Gradient wipe effect
    const wipeX = w * progress * 2 - w;
    const grad = ctx.createLinearGradient(wipeX, 0, wipeX + w, 0);
    grad.addColorStop(0, '#e94560');
    grad.addColorStop(0.5, '#0f3460');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Text (brief flash)
    if (text && progress > 0.3 && progress < 0.8) {
      ctx.globalAlpha = Math.min((progress - 0.3) * 5, 1, (0.8 - progress) * 5);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(w * 0.04)}px DejaVu Sans`;
      ctx.textAlign = 'center';
      ctx.fillText(text.slice(0, 40), w / 2, h / 2);
      ctx.globalAlpha = 1;
    }
  }
};
