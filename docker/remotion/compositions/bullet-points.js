/**
 * BulletPoints — Animated bullet list (appear one-by-one)
 * Props: { title: string, items: string[] }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const title = props.title || '';
    const items = props.items || [];

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#e94560';
    ctx.font = `bold ${Math.round(w * 0.035)}px DejaVu Sans`;
    ctx.textAlign = 'left';
    const margin = w * 0.08;
    ctx.fillText(title.slice(0, 60), margin, h * 0.15);

    // Divider
    ctx.fillStyle = '#e94560';
    ctx.fillRect(margin, h * 0.18, w * 0.3, 2);

    // Bullets
    const n = Math.min(items.length, 6);
    const bulletSize = Math.round(w * 0.025);

    for (let i = 0; i < n; i++) {
      const itemProgress = Math.min(Math.max(progress * (n + 1) - i, 0), 1);
      if (itemProgress <= 0) continue;

      const y = h * 0.25 + i * (h * 0.1);
      ctx.globalAlpha = itemProgress;

      // Bullet dot
      ctx.fillStyle = '#e94560';
      ctx.beginPath();
      ctx.arc(margin + 8, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = `${bulletSize}px DejaVu Sans`;
      ctx.fillText(String(items[i]).slice(0, 70), margin + 25, y + 6);
    }

    ctx.globalAlpha = 1;
  }
};
