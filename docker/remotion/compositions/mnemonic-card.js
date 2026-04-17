/**
 * MnemonicCard — Memory aid visualization
 * Props: { mnemonic: string, fullForm: string[], topic?: string }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const mnemonic = props.mnemonic || 'SMART';
    const fullForm = props.fullForm || mnemonic.split('').map(c => c + '...');
    const topic = props.topic || '';

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Topic
    if (topic) {
      ctx.fillStyle = '#888888';
      ctx.font = `${Math.round(w * 0.02)}px DejaVu Sans`;
      ctx.textAlign = 'center';
      ctx.fillText(topic.slice(0, 40), w / 2, h * 0.1);
    }

    // Mnemonic letters — appear one by one
    const letters = mnemonic.split('').slice(0, 8);
    const spacing = Math.min(w * 0.12, w * 0.8 / letters.length);
    const startX = w / 2 - (letters.length - 1) * spacing / 2;

    for (let i = 0; i < letters.length; i++) {
      const letterProgress = Math.min(Math.max(progress * (letters.length + 2) - i, 0), 1);
      if (letterProgress <= 0) continue;

      const x = startX + i * spacing;
      const y = h * 0.35;

      // Big letter
      ctx.globalAlpha = letterProgress;
      ctx.fillStyle = '#e94560';
      ctx.font = `bold ${Math.round(w * 0.06)}px DejaVu Sans`;
      ctx.textAlign = 'center';
      ctx.fillText(letters[i], x, y);

      // Full form
      if (fullForm[i]) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.round(w * 0.022)}px DejaVu Sans`;
        ctx.fillText(String(fullForm[i]).slice(0, 20), x, y + w * 0.06);
      }
    }

    // Bottom reminder
    if (progress > 0.7) {
      ctx.globalAlpha = Math.min((progress - 0.7) * 5, 1);
      ctx.fillStyle = '#f0a500';
      ctx.font = `italic ${Math.round(w * 0.02)}px DejaVu Sans`;
      ctx.textAlign = 'center';
      ctx.fillText('Remember this mnemonic for revision!', w / 2, h * 0.85);
    }

    ctx.globalAlpha = 1;
  }
};
