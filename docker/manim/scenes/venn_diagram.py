"""
VennDiagramScene — Overlapping concepts (Union/State/Concurrent lists)
Config: { "topic": str, "sets": [{"label": str, "items": [str]}] }
Supports 2 or 3 sets.
"""
from manim import *
import numpy as np


class VennDiagramScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Venn Diagram")
        sets = self.config_data.get("sets", [
            {"label": "Union List", "items": ["Defence", "Currency", "Foreign Affairs"]},
            {"label": "State List", "items": ["Police", "Health", "Agriculture"]},
            {"label": "Concurrent", "items": ["Education", "Forests", "Trade Unions"]},
        ])

        title = Text(topic, font_size=36, color=YELLOW).to_edge(UP)
        self.play(Write(title))

        n = min(len(sets), 3)
        colors = [BLUE, RED, GREEN]
        positions = [[-1.5, 0, 0], [1.5, 0, 0], [0, -1.2, 0]]

        circles = []
        for i in range(n):
            circle = Circle(radius=1.8, color=colors[i], fill_opacity=0.15, stroke_width=2)
            circle.move_to(positions[i])
            label = Text(
                str(sets[i].get("label", f"Set {i+1}"))[:15],
                font_size=18, color=colors[i]
            ).next_to(circle, UP if i < 2 else DOWN, buff=0.2)
            circles.append(circle)
            self.play(Create(circle), Write(label), run_time=0.5)

        # Show items for each set
        for i in range(n):
            items = sets[i].get("items", [])[:3]
            for j, item in enumerate(items):
                offset = [0, -0.3 * j, 0]
                pos = np.array(positions[i]) + np.array(offset)
                # Push items away from center slightly
                if n == 3:
                    center = np.array([0, -0.4, 0])
                    direction = pos - center
                    if np.linalg.norm(direction) > 0:
                        pos = pos + 0.3 * direction / np.linalg.norm(direction)

                text = Text(str(item)[:18], font_size=12, color=WHITE).move_to(pos)
                self.play(FadeIn(text), run_time=0.3)

        self.wait(2)
