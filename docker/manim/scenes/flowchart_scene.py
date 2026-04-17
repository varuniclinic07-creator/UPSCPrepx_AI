"""
FlowchartScene — Process flows (bill passage, policy implementation)
Config: { "topic": str, "steps": [{"title": str, "description": str}] }
"""
from manim import *


class FlowchartScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Process Flow")
        steps = self.config_data.get("steps", [
            {"title": "Introduction", "description": "Bill is introduced"},
            {"title": "Committee Review", "description": "Sent to standing committee"},
            {"title": "Discussion", "description": "Debated in Parliament"},
            {"title": "Voting", "description": "Put to vote"},
            {"title": "Assent", "description": "Presidential assent"},
        ])

        # Title
        title = Text(topic, font_size=36, color=YELLOW).to_edge(UP)
        self.play(Write(title))
        self.wait(0.3)

        boxes = []
        n = min(len(steps), 6)
        start_y = 1.5

        for i in range(n):
            step = steps[i]
            y = start_y - i * 1.2
            box = RoundedRectangle(
                corner_radius=0.15, width=5, height=0.8, color=BLUE
            ).move_to([0, y, 0])
            label = Text(
                str(step.get("title", f"Step {i+1}"))[:30],
                font_size=20, color=WHITE
            ).move_to(box.get_center())
            group = VGroup(box, label)
            boxes.append(group)

            self.play(FadeIn(group), run_time=0.4)

            # Arrow from previous
            if i > 0:
                arrow = Arrow(
                    boxes[i - 1].get_bottom(), group.get_top(),
                    buff=0.1, color=GREEN, stroke_width=2
                )
                self.play(Create(arrow), run_time=0.3)

        self.wait(2)
