"""
ArticleHighlightScene — Constitutional article text with animated highlights
Config: { "topic": str, "article_number": str, "text": str, "highlights": [str] }
"""
from manim import *


class ArticleHighlightScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Constitutional Article")
        article_num = self.config_data.get("article_number", "Article 21")
        full_text = self.config_data.get("text",
            "No person shall be deprived of his life or personal liberty "
            "except according to procedure established by law."
        )
        highlights = self.config_data.get("highlights", ["life", "personal liberty", "procedure established by law"])

        # Title with article number
        header = VGroup(
            Text(article_num, font_size=36, color=GOLD),
            Text(topic[:40], font_size=20, color=GRAY),
        ).arrange(DOWN, buff=0.2).to_edge(UP)
        self.play(FadeIn(header))

        # Article text — break into lines of ~50 chars
        words = full_text.split()
        lines = []
        current_line = ""
        for w in words:
            if len(current_line) + len(w) + 1 > 50:
                lines.append(current_line.strip())
                current_line = w + " "
            else:
                current_line += w + " "
        if current_line.strip():
            lines.append(current_line.strip())

        text_group = VGroup()
        for i, line in enumerate(lines[:6]):
            t = Text(line, font_size=20, color=WHITE)
            text_group.add(t)
        text_group.arrange(DOWN, buff=0.2).move_to(ORIGIN)

        self.play(Write(text_group), run_time=1.5)
        self.wait(0.5)

        # Highlight key phrases
        for phrase in highlights[:4]:
            phrase_lower = phrase.lower()
            for line_mob in text_group:
                line_text = line_mob.text.lower() if hasattr(line_mob, 'text') else ""
                if phrase_lower in line_text:
                    box = SurroundingRectangle(line_mob, color=YELLOW, buff=0.05, stroke_width=2)
                    label = Text(f"Key: {phrase[:20]}", font_size=14, color=YELLOW).next_to(box, RIGHT, buff=0.3)
                    self.play(Create(box), FadeIn(label), run_time=0.5)
                    self.wait(0.5)
                    self.play(FadeOut(label), run_time=0.2)
                    break

        self.wait(2)
