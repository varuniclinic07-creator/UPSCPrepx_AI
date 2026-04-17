"""
BarGraphScene — Statistical comparisons, year-over-year data
Config: { "topic": str, "bars": [{"label": str, "value": float}], "y_label": str }
"""
from manim import *


BAR_COLORS = [BLUE, GREEN, RED, YELLOW, PURPLE, ORANGE, TEAL, PINK]


class BarGraphScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Statistics")
        bars = self.config_data.get("bars", [
            {"label": "2020", "value": 45},
            {"label": "2021", "value": 62},
            {"label": "2022", "value": 78},
            {"label": "2023", "value": 85},
            {"label": "2024", "value": 91},
        ])
        y_label = self.config_data.get("y_label", "Value")

        title = Text(topic, font_size=36, color=YELLOW).to_edge(UP)
        self.play(Write(title))

        # Axes
        max_val = max((b.get("value", 1) for b in bars), default=100)
        n = min(len(bars), 8)

        # Draw base line
        base = Line(LEFT * 4.5, RIGHT * 4.5, color=WHITE).shift(DOWN * 2)
        y_axis = Line([-4.5, -2, 0], [-4.5, 2.5, 0], color=WHITE)
        y_text = Text(y_label[:15], font_size=16, color=GRAY).next_to(y_axis, UP, buff=0.1)
        self.play(Create(base), Create(y_axis), Write(y_text))

        bar_width = 8.0 / max(n, 1) * 0.6
        spacing = 8.0 / max(n, 1)

        for i in range(n):
            b = bars[i]
            value = b.get("value", 0)
            height = (value / max_val) * 4 if max_val > 0 else 0.1
            x = -4 + i * spacing + spacing / 2
            color = BAR_COLORS[i % len(BAR_COLORS)]

            bar = Rectangle(
                width=bar_width, height=height,
                color=color, fill_opacity=0.8
            ).move_to([x, -2 + height / 2, 0])

            label = Text(str(b.get("label", ""))[:8], font_size=14, color=WHITE).next_to(bar, DOWN, buff=0.1)
            val_text = Text(str(int(value)), font_size=14, color=color).next_to(bar, UP, buff=0.05)

            self.play(GrowFromEdge(bar, DOWN), Write(label), Write(val_text), run_time=0.5)

        self.wait(2)
