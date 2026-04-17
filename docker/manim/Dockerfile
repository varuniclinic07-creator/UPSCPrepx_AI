FROM manimcommunity/manim:stable

USER root

RUN pip install --no-cache-dir fastapi uvicorn aiofiles

COPY server.py /manim/server.py
COPY scenes/ /manim/scenes/

WORKDIR /manim

RUN mkdir -p /manim/media /manim/output /tmp/manim_scenes

EXPOSE 8080

CMD ["python", "server.py"]
