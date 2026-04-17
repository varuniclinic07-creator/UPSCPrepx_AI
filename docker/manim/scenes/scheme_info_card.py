"""
SchemeInfoCardScene — Government scheme info cards
Config: { "topic": str, "scheme_name": str, "ministry": str,
          "year": str, "beneficiaries": str, "key_features": [str] }
"""
from manim import *


class SchemeInfoCardScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Government Scheme")
        scheme_name = self.config_data.get("scheme_name", topic)
        ministry = self.config_data.get("ministry", "Ministry of ___")
        year = self.config_data.get("year", "2024")
        beneficiaries = self.config_data.get("beneficiaries", "All citizens")
        features = self.config_data.get("key_features", [
            "Feature 1: Coverage details",
            "Feature 2: Implementation method",
            "Feature 3: Budget allocation",
        ])

        # Card background
        card = RoundedRectangle(
            corner_radius=0.3, width=10, height=6,
            color=BLUE, fill_opacity=0.1, stroke_width=2
        )
        self.play(Create(card))

        # Scheme name (big)
        name = Text(scheme_name[:35], font_size=32, color=GOLD).move_to([0, 2.2, 0])
        self.play(Write(name))

        # Ministry & Year row
        info_row = Text(
            f"{ministry[:30]}  |  Launched: {year}",
            font_size=16, color=GRAY
        ).move_to([0, 1.5, 0])
        self.play(Write(info_row))

        # Divider
        divider = Line(LEFT * 4, RIGHT * 4, color=BLUE, stroke_width=1).move_to([0, 1.1, 0])
        self.play(Create(divider))

        # Beneficiaries
        ben_label = Text("Beneficiaries:", font_size=16, color=BLUE).move_to([-3.5, 0.6, 0])
        ben_text = Text(beneficiaries[:40], font_size=16, color=WHITE).next_to(ben_label, RIGHT, buff=0.2)
        self.play(Write(ben_label), Write(ben_text), run_time=0.5)

        # Key features
        feat_label = Text("Key Features:", font_size=16, color=BLUE).move_to([-3.5, 0, 0])
        self.play(Write(feat_label))

        for i, feature in enumerate(features[:4]):
            bullet = Text(f"  {feature[:45]}", font_size=14, color=WHITE).move_to([0, -0.5 - i * 0.5, 0])
            self.play(FadeIn(bullet), run_time=0.3)

        self.wait(2)
