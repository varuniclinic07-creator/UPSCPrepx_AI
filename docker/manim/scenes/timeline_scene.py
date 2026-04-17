"""
TimelineScene — Animated historical timelines
Config: { "topic": str, "events": [{"year": str, "title": str, "description": str}] }
Falls back to auto-generated sample if events not provided.
"""
from manim import *
import json


class TimelineScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Historical Timeline")
        events = self.config_data.get("events", [
            {"year": "1947", "title": "Independence", "description": "India gains freedom"},
            {"year": "1950", "title": "Republic Day", "description": "Constitution comes into effect"},
            {"year": "1991", "title": "Liberalization", "description": "Economic reforms begin"},
        ])

        # Title
        title = Text(topic, font_size=36, color=YELLOW).to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Timeline line
        line = Line(LEFT * 5.5, RIGHT * 5.5, color=WHITE).shift(DOWN * 0.5)
        self.play(Create(line))

        # Place events along timeline
        n = len(events)
        spacing = 10.0 / max(n - 1, 1)

        for i, event in enumerate(events[:6]):  # Max 6 events
            x = -5 + i * spacing
            dot = Dot(point=[x, -0.5, 0], color=BLUE)
            year_text = Text(str(event.get("year", "")), font_size=20, color=BLUE).next_to(dot, DOWN, buff=0.2)
            title_text = Text(
                str(event.get("title", ""))[:25], font_size=16, color=WHITE
            ).next_to(year_text, DOWN, buff=0.1)

            self.play(FadeIn(dot), Write(year_text), Write(title_text), run_time=0.6)

        self.wait(1)

        # Summary box
        summary = Text("Key events in " + topic[:30], font_size=24, color=GREEN).to_edge(DOWN)
        self.play(FadeIn(summary))
        self.wait(2)
