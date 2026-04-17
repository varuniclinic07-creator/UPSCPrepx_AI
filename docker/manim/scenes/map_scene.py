"""
MapScene — Geographic overlays (simplified India map with highlights)
Config: { "topic": str, "regions": [{"name": str, "highlight": bool}] }
Uses geometric shapes to represent India outline (Manim doesn't have built-in maps).
"""
from manim import *
import numpy as np


class MapScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Geographic Overview")
        regions = self.config_data.get("regions", [
            {"name": "North India", "highlight": True},
            {"name": "South India", "highlight": False},
            {"name": "East India", "highlight": True},
            {"name": "West India", "highlight": False},
        ])

        # Title
        title = Text(topic, font_size=36, color=YELLOW).to_edge(UP)
        self.play(Write(title))

        # Simplified India outline using polygon
        india_outline = Polygon(
            [0, 3, 0], [-1.5, 2, 0], [-2, 1, 0], [-2.5, 0, 0],
            [-1.5, -1.5, 0], [-0.5, -3, 0], [0, -3.5, 0],
            [0.5, -3, 0], [1, -1.5, 0], [2.5, 0, 0],
            [2, 1, 0], [1.5, 2, 0],
            color=WHITE, fill_opacity=0.1
        ).scale(0.7).shift(LEFT * 1)
        self.play(Create(india_outline))
        self.wait(0.3)

        # Region labels on right side
        for i, region in enumerate(regions[:6]):
            name = str(region.get("name", f"Region {i+1}"))[:20]
            highlighted = region.get("highlight", False)
            color = GREEN if highlighted else GRAY
            y = 2 - i * 0.8

            dot = Dot(color=color).move_to([3.5, y, 0])
            label = Text(name, font_size=18, color=color).next_to(dot, RIGHT, buff=0.2)
            self.play(FadeIn(dot), Write(label), run_time=0.4)

        self.wait(2)
