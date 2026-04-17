"""
ComparisonTableScene — Side-by-side comparisons (Fundamental Rights vs DPSP)
Config: { "topic": str, "col_a": str, "col_b": str,
          "rows": [{"a": str, "b": str}] }
"""
from manim import *


class ComparisonTableScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Comparison")
        col_a = self.config_data.get("col_a", "Feature A")
        col_b = self.config_data.get("col_b", "Feature B")
        rows = self.config_data.get("rows", [
            {"a": "Enforceable", "b": "Non-enforceable"},
            {"a": "Part III", "b": "Part IV"},
            {"a": "Individual rights", "b": "State policy"},
        ])

        # Title
        title = Text(topic, font_size=36, color=YELLOW).to_edge(UP)
        self.play(Write(title))

        # Headers
        header_a = Text(col_a[:20], font_size=22, color=BLUE).move_to([-2.5, 2, 0])
        header_b = Text(col_b[:20], font_size=22, color=GREEN).move_to([2.5, 2, 0])
        divider = Line([0, 2.5, 0], [0, -3, 0], color=GRAY)
        self.play(Write(header_a), Write(header_b), Create(divider))

        # Rows
        for i, row in enumerate(rows[:5]):
            y = 1.2 - i * 0.9
            h_line = Line([-5, y + 0.4, 0], [5, y + 0.4, 0], color=GRAY, stroke_width=0.5)
            text_a = Text(str(row.get("a", ""))[:25], font_size=16, color=WHITE).move_to([-2.5, y, 0])
            text_b = Text(str(row.get("b", ""))[:25], font_size=16, color=WHITE).move_to([2.5, y, 0])
            self.play(Create(h_line), Write(text_a), Write(text_b), run_time=0.5)

        self.wait(2)
