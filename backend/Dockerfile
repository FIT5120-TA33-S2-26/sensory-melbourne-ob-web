FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DATA_MODEL_PATH=/opt/sensory-data/model

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
# `data_model` is a named BuildKit context supplied by Compose from the sibling
# private data repository. Credentials never enter this image or its layers.
COPY --from=data_model . /opt/sensory-data/model

RUN useradd --create-home --uid 10001 sensory \
    && chown -R sensory:sensory /app
USER sensory

EXPOSE 5500

CMD ["gunicorn", "--bind=0.0.0.0:5500", "--workers=2", "--threads=2", "--timeout=120", "--access-logfile=-", "--error-logfile=-", "app:create_app()"]
