"""
PieChartScene — Budget breakdowns, demographic data
Config: { "topic": str, "slices": [{"label": str, "value": float, "color": str}] }
"""
from manim import *
import numpy as np


CHART_COLORS = [BLUE, GREEN, RED, YELLOW, PURPLE, ORANGE, TEAL, PINK]


class PieChartScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Distribution")
        slices = self.config_data.get("slices", [
            {"label": "Defence", "value": 30},
            {"label": "Education", "value": 20},
            {"label": "Health", "value": 15},
            {"label": "Infrastructure", "value": 25},
            {"label": "Other", "value": 10},
        ])

        title = Text(topic, font_size=36, color=YELLOW).to_edge(UP)
        self.play(Write(title))

        # Compute angles
        total = sum(s.get("value", 1) for s in slices)
        if total == 0:
            total = 1

        start_angle = 90
        pie_group = VGroup()
        legend_items = VGroup()

        for i, s in enumerate(slices[:8]):
            value = s.get("value", 1)
            angle = (value / total) * 360
            color = CHART_COLORS[i % len(CHART_COLORS)]

            sector = AnnularSector(
                inner_radius=0, outer_radius=2,
                angle=angle * DEGREES, start_angle=start_angle * DEGREES,
                color=color, fill_opacity=0.8
            ).shift(LEFT * 1.5)
            pie_group.add(sector)

            # Legend
            label_text = f"{s.get('label', '')[:15]} ({value:.0f}%)"
            dot = Dot(color=color).move_to([3, 2 - i * 0.6, 0])
            label = Text(label_text, font_size=14, color=WHITE).next_to(dot, RIGHT, buff=0.15)
            legend_items.add(VGroup(dot, label))

            start_angle += angle

        self.play(FadeIn(pie_group), run_time=1)
        self.play(FadeIn(legend_items), run_time=0.8)
        self.wait(2)
