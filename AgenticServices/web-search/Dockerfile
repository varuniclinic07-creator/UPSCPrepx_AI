FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY web-search/main.py .

EXPOSE 8030

CMD ["python", "main.py"]
