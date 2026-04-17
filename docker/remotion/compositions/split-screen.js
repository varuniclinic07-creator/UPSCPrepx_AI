/**
 * SplitScreen — Two-panel comparison
 * Props: { leftTitle: string, rightTitle: string, leftItems: string[], rightItems: string[] }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const leftTitle = props.leftTitle || 'Side A';
    const rightTitle = props.rightTitle || 'Side B';
    const leftItems = props.leftItems || [];
    const rightItems = props.rightItems || [];

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Left panel
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, w / 2 - 2, h);

    // Right panel
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(w / 2 + 2, 0, w / 2, h);

    // Divider
    ctx.fillStyle = '#e94560';
    ctx.fillRect(w / 2 - 2, 0, 4, h);

    // Left title
    ctx.globalAlpha = Math.min(progress * 3, 1);
    ctx.fillStyle = '#e94560';
    ctx.font = `bold ${Math.round(w * 0.025)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    ctx.fillText(leftTitle.slice(0, 20), w / 4, h * 0.1);

    // Right title
    ctx.fillText(rightTitle.slice(0, 20), w * 3 / 4, h * 0.1);

    // Items
    const fontSize = Math.round(w * 0.018);
    ctx.font = `${fontSize}px DejaVu Sans`;

    const n = Math.max(leftItems.length, rightItems.length, 1);
    for (let i = 0; i < Math.min(n, 8); i++) {
      const itemP = Math.min(Math.max(progress * (n + 1) - i, 0), 1);
      if (itemP <= 0) continue;

      const y = h * 0.18 + i * (h * 0.09);
      ctx.globalAlpha = itemP;

      if (leftItems[i]) {
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(String(leftItems[i]).slice(0, 30), w / 4, y);
      }
      if (rightItems[i]) {
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(String(rightItems[i]).slice(0, 30), w * 3 / 4, y);
      }
    }

    ctx.globalAlpha = 1;
  }
};
