"""
MathSolverScene — Step-by-step math (CSAT quant, economic calculations)
Config: { "topic": str, "steps": [{"expression": str, "explanation": str}] }
"""
from manim import *


class MathSolverScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Math Solution")
        steps = self.config_data.get("steps", [
            {"expression": "GDP = C + I + G + (X - M)", "explanation": "GDP formula"},
            {"expression": "C = 500, I = 200, G = 300", "explanation": "Given values"},
            {"expression": "X - M = 50", "explanation": "Net exports"},
            {"expression": "GDP = 500 + 200 + 300 + 50", "explanation": "Substituting"},
            {"expression": "GDP = 1050", "explanation": "Final answer"},
        ])

        title = Text(topic, font_size=32, color=YELLOW).to_edge(UP)
        self.play(Write(title))
        self.wait(0.3)

        prev_group = None
        for i, step in enumerate(steps[:6]):
            expr = str(step.get("expression", ""))[:50]
            explanation = str(step.get("explanation", ""))[:40]
            y = 1.8 - i * 1.1

            # Step number
            step_num = Text(f"Step {i+1}:", font_size=16, color=BLUE).move_to([-5, y, 0])

            # Expression (using MathTex if it looks like math, else Text)
            try:
                expr_mob = MathTex(expr, font_size=28, color=WHITE).next_to(step_num, RIGHT, buff=0.3)
            except Exception:
                expr_mob = Text(expr, font_size=20, color=WHITE).next_to(step_num, RIGHT, buff=0.3)

            # Explanation
            expl_mob = Text(explanation, font_size=14, color=GRAY).next_to(expr_mob, RIGHT, buff=0.4)

            group = VGroup(step_num, expr_mob, expl_mob)

            if prev_group:
                # Highlight transition
                self.play(prev_group.animate.set_opacity(0.5), run_time=0.2)

            self.play(FadeIn(group), run_time=0.5)
            prev_group = group

        # Highlight final answer
        if prev_group:
            box = SurroundingRectangle(prev_group, color=GREEN, buff=0.15)
            self.play(Create(box))

        self.wait(2)
