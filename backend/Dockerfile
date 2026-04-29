# syntax=docker/dockerfile:1.7

FROM python:3.12-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
 && rm -rf /var/lib/apt/lists/*

RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

WORKDIR /app
COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install .


FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/venv/bin:$PATH" \
    PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --uid 1001 --create-home app

COPY --from=builder /venv /venv

WORKDIR /app
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
COPY seed.py ./

USER app
ENV DATABASE_URL=sqlite:////home/app/dev.db
RUN python seed.py

EXPOSE 8080

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
