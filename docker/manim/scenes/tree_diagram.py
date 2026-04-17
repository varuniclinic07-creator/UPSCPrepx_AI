"""
TreeDiagramScene — Hierarchical structures (government org charts)
Config: { "topic": str, "root": str, "children": [{"label": str, "children": [{"label": str}]}] }
"""
from manim import *


class TreeDiagramScene(Scene):
    def __init__(self, config=None, **kwargs):
        super().__init__(**kwargs)
        self.config_data = config or {}

    def construct(self):
        topic = self.config_data.get("topic", "Hierarchy")
        root_label = self.config_data.get("root", "Root")
        children = self.config_data.get("children", [
            {"label": "Branch A", "children": [{"label": "Leaf 1"}, {"label": "Leaf 2"}]},
            {"label": "Branch B", "children": [{"label": "Leaf 3"}, {"label": "Leaf 4"}]},
            {"label": "Branch C", "children": [{"label": "Leaf 5"}]},
        ])

        title = Text(topic, font_size=36, color=YELLOW).to_edge(UP)
        self.play(Write(title))

        # Root node
        root_box = RoundedRectangle(corner_radius=0.1, width=3, height=0.6, color=GOLD, fill_opacity=0.3)
        root_text = Text(root_label[:20], font_size=18, color=WHITE).move_to(root_box)
        root_group = VGroup(root_box, root_text).move_to([0, 2, 0])
        self.play(FadeIn(root_group))

        # Level 1 children
        n = min(len(children), 4)
        spacing = 10.0 / max(n, 1)

        for i in range(n):
            child = children[i]
            x = -4.5 + i * spacing + spacing / 2
            y = 0.3

            box = RoundedRectangle(corner_radius=0.1, width=2.2, height=0.5, color=BLUE, fill_opacity=0.3)
            text = Text(str(child.get("label", ""))[:18], font_size=14, color=WHITE).move_to(box)
            group = VGroup(box, text).move_to([x, y, 0])

            line = Line(root_group.get_bottom(), group.get_top(), color=GRAY, stroke_width=1.5)
            self.play(Create(line), FadeIn(group), run_time=0.4)

            # Level 2 grandchildren
            grandchildren = child.get("children", [])[:3]
            gc_spacing = 2.2 / max(len(grandchildren), 1)
            for j, gc in enumerate(grandchildren):
                gx = x - 1 + j * gc_spacing + gc_spacing / 2
                gy = -1.5

                gc_box = RoundedRectangle(corner_radius=0.08, width=1.5, height=0.4, color=GREEN, fill_opacity=0.2)
                gc_text = Text(str(gc.get("label", ""))[:14], font_size=11, color=WHITE).move_to(gc_box)
                gc_group = VGroup(gc_box, gc_text).move_to([gx, gy, 0])

                gc_line = Line(group.get_bottom(), gc_group.get_top(), color=GRAY, stroke_width=1)
                self.play(Create(gc_line), FadeIn(gc_group), run_time=0.3)

        self.wait(2)
