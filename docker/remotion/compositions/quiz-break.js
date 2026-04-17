/**
 * QuizBreak — MCQ overlay with timer countdown
 * Props: { question: string, options: string[], correctIndex?: number }
 */
module.exports = {
  render(ctx, props, frame, totalFrames, w, h) {
    const progress = frame / totalFrames;
    const question = props.question || 'Quick Quiz!';
    const options = props.options || ['Option A', 'Option B', 'Option C', 'Option D'];
    const correctIndex = props.correctIndex ?? 0;

    // Background
    ctx.fillStyle = '#0a0a23';
    ctx.fillRect(0, 0, w, h);

    // "QUIZ BREAK" header
    ctx.fillStyle = '#e94560';
    ctx.font = `bold ${Math.round(w * 0.03)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    ctx.fillText('QUIZ BREAK', w / 2, h * 0.1);

    // Timer countdown (shows remaining time)
    const timerVal = Math.max(Math.ceil((1 - progress) * 10), 0);
    ctx.fillStyle = timerVal <= 3 ? '#e94560' : '#f0a500';
    ctx.font = `bold ${Math.round(w * 0.04)}px DejaVu Sans`;
    ctx.fillText(String(timerVal), w * 0.9, h * 0.1);

    // Question
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.round(w * 0.028)}px DejaVu Sans`;
    ctx.textAlign = 'center';
    wrapText(ctx, question, w / 2, h * 0.25, w * 0.75, w * 0.04);

    // Options
    const labels = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < Math.min(options.length, 4); i++) {
      const y = h * 0.45 + i * (h * 0.12);
      const optW = w * 0.6;
      const optX = (w - optW) / 2;

      // Reveal answer near the end
      const isCorrect = i === correctIndex;
      const showAnswer = progress > 0.8;

      ctx.fillStyle = showAnswer && isCorrect ? '#2d6a4f' : '#1e293b';
      ctx.strokeStyle = showAnswer && isCorrect ? '#40c057' : '#334155';
      ctx.lineWidth = 2;
      roundRect(ctx, optX, y - h * 0.03, optW, h * 0.08, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.round(w * 0.022)}px DejaVu Sans`;
      ctx.textAlign = 'left';
      ctx.fillText(`${labels[i]}. ${String(options[i]).slice(0, 50)}`, optX + 15, y + h * 0.02);
    }
  }
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

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
