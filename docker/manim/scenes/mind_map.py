"""
MindMapScene — Radial mind maps for topic revision
Config: { "topic": str, "center": str,
          "branches": [{"label": str, "sub": [str]}] }
"""
from manim import *
import numpy as np


BRANCH_COLORS = [BLUE, GREEN, RED, YELLOW, PURPLE, ORANGE, TEAL, PINK]


class MindMapScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Mind Map")
        center_label = self.config_data.get("center", topic)
        branches = self.config_data.get("branches", [
            {"label": "Causes", "sub": ["Economic", "Social", "Political"]},
            {"label": "Effects", "sub": ["Short-term", "Long-term"]},
            {"label": "Solutions", "sub": ["Policy", "Grassroots", "Tech"]},
            {"label": "Examples", "sub": ["India", "Global"]},
        ])

        # Center node
        center_circle = Circle(radius=0.8, color=GOLD, fill_opacity=0.3)
        center_text = Text(center_label[:18], font_size=18, color=WHITE).move_to(center_circle)
        center = VGroup(center_circle, center_text)
        self.play(FadeIn(center))

        n = min(len(branches), 6)
        for i in range(n):
            branch = branches[i]
            angle = i * (360 / n)
            rad = angle * DEGREES
            color = BRANCH_COLORS[i % len(BRANCH_COLORS)]

            # Branch node position
            bx = 2.8 * np.cos(rad)
            by = 2.8 * np.sin(rad)

            # Branch node
            b_rect = RoundedRectangle(
                corner_radius=0.1, width=2, height=0.5,
                color=color, fill_opacity=0.25
            ).move_to([bx, by, 0])
            b_text = Text(
                str(branch.get("label", ""))[:16],
                font_size=14, color=WHITE
            ).move_to(b_rect)
            b_group = VGroup(b_rect, b_text)

            # Line from center to branch
            line = Line(center.get_center(), b_group.get_center(), color=color, stroke_width=2)
            self.play(Create(line), FadeIn(b_group), run_time=0.4)

            # Sub-branches
            subs = branch.get("sub", [])[:4]
            for j, sub in enumerate(subs):
                sub_angle = angle + (j - len(subs) / 2) * 15
                sub_rad = sub_angle * DEGREES
                sx = bx + 1.8 * np.cos(sub_rad)
                sy = by + 1.8 * np.sin(sub_rad)

                # Clamp to screen bounds
                sx = max(-6, min(6, sx))
                sy = max(-3.2, min(3.2, sy))

                s_text = Text(str(sub)[:14], font_size=11, color=color).move_to([sx, sy, 0])
                s_line = Line(
                    b_group.get_center(), s_text.get_center(),
                    color=color, stroke_width=1, stroke_opacity=0.5
                )
                self.play(Create(s_line), FadeIn(s_text), run_time=0.25)

        self.wait(2)
