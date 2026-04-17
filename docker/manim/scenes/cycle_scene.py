"""
CycleScene — Cyclical processes (water cycle, economic cycles)
Config: { "topic": str, "stages": [{"label": str}] }
"""
from manim import *
import numpy as np


class CycleScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Cycle Process")
        stages = self.config_data.get("stages", [
            {"label": "Evaporation"},
            {"label": "Condensation"},
            {"label": "Precipitation"},
            {"label": "Collection"},
        ])

        title = Text(topic, font_size=36, color=YELLOW).to_edge(UP)
        self.play(Write(title))

        n = min(len(stages), 8)
        radius = 2.2
        stage_groups = []
        colors = [BLUE, GREEN, RED, YELLOW, PURPLE, ORANGE, TEAL, PINK]

        for i in range(n):
            angle = 90 - i * (360 / n)  # Start from top
            rad = angle * DEGREES
            x = radius * np.cos(rad)
            y = radius * np.sin(rad) - 0.3

            color = colors[i % len(colors)]
            circle = Circle(radius=0.5, color=color, fill_opacity=0.2)
            circle.move_to([x, y, 0])
            label = Text(
                str(stages[i].get("label", f"Stage {i+1}"))[:14],
                font_size=13, color=WHITE
            ).move_to(circle)
            group = VGroup(circle, label)
            stage_groups.append(group)
            self.play(FadeIn(group), run_time=0.4)

        # Arrows connecting stages in a cycle
        for i in range(n):
            start = stage_groups[i].get_center()
            end = stage_groups[(i + 1) % n].get_center()
            direction = end - start
            norm = np.linalg.norm(direction)
            if norm > 0:
                unit = direction / norm
                arrow = Arrow(
                    start + unit * 0.55, end - unit * 0.55,
                    color=GRAY, stroke_width=2, buff=0
                )
                self.play(Create(arrow), run_time=0.3)

        self.wait(2)
