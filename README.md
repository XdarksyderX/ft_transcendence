# ft\_transcendence

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-blue)](https://docs.docker.com/compose/)
[![Django](https://img.shields.io/badge/Backend-Django-informational)](https://www.djangoproject.com/)
[![WebSockets](https://img.shields.io/badge/Realtime-WebSockets-success)](#)

**ft\_transcendence** is a multiplayer, real‑time **SPA**. It blends classic games (Pong, Chess) with social features (auth, friends, chat, profiles) in a single web app. Built as the final project of the **42 Common Core**.

---

## Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Architecture](#architecture)
* [Project Structure](#project-structure)
* [Getting Started (Docker)](#getting-started-docker)

  * [Prereqs](#prereqs)
  * [Quickstart](#quickstart)
  * [Environment](#environment)
  * [.env per service (examples)](#env-per-service-examples)
  * [Ports](#ports)
* [Security](#security)
* [Notes (Production)](#notes-production)
* [Contributing](#contributing)
* [License](#license)

---

## Features

* **Friends:** search, invite, accept/reject, block/unfriend.
* **Chat:** collapsible DMs; invite to games/tournaments from chat; quick profile access.
* **Profiles:** username/nickname; avatar (3 bots) with canvas color customization **or** user‑uploaded photo.
* **Pong:** local / online / vs **AI**; paddle size, ball speed, points to win, boost; **tournaments (brackets)**.
* **Chess:** online/local; casual & ranked with matchmaking; board/piece themes; variants **960**, **Atomic**, **Kirby**.
* **Stats & History:** per‑user dashboards; full match history per game.

## Tech Stack

* **Frontend:** Vanilla JavaScript + Bootstrap; custom SPA router; **WebSockets** for RT updates.
* **Backend:** **Django** microservices (REST); **Django Channels** for WS.
* **Data:** **PostgreSQL** per service; **Redis** for Channels/cache/state.
* **Async/Messaging:** **Celery** workers; **RabbitMQ** broker.
* **Edge:** **Nginx** reverse proxy (HTTP/HTTPS, WS pass‑through, static).
* **Deploy:** **Docker** + **Docker Compose** (multi‑container, dev‑first).

## Architecture

* **Auth:** email/password; optional **2FA (TOTP)**; issues **JWT (RSA‑signed)**.
* **Social:** profiles; friends (request/accept/block); **chat** (WS DMs); presence.
* **Pong:** matchmaking; game loop & rules; tuning; results; tournaments.
* **Chess:** casual/ranked; matchmaking; variants (960/Atomic/Kirby); results.
* **Notifications:** fan‑out real‑time events to clients (WS channels/groups).
* **Gateway (Nginx):** routes REST/WS to services; serves frontend/static.

Inter‑service communication: **RabbitMQ** (events/tasks). Each service owns its **Postgres** schema. Shared real‑time state (channels/groups) in **Redis**.

## Project Structure

```
ft_transcendence/
├─ compose.yaml
├─ docker-compose.yml          # if present, Compose will also pick it up
├─ Makefile
├─ gencert.sh                  # generates self‑signed TLS cert (used by gateway)
├─ volume-data/                # bind volumes (created by `make prepare`)
│  ├─ auth/
│  ├─ social/
│  ├─ pong/
│  ├─ chess/
│  └─ notifications/
├─ frontend/
├─ gateway/                    # Nginx config & assets
├─ auth/
│  └─ service/
│     └─ config/keys/          # private.pem / public.pem (JWT)
├─ social/
│  └─ service/
├─ pong/
│  └─ service/
├─ chess/
│  └─ service/
├─ notifications/
│  └─ service/
├─ docs/
└─ README.md
```

## Getting Started (Docker)

### Prereqs
- **Docker** and **Docker Compose** installed
- **GNU Make** (for the Makefile targets)
- **OpenSSL** (used by key/cert generation)

### Quickstart
```bash
# 1) Clone
git clone https://github.com/XdarksyderX/ft_transcendence.git
cd ft_transcendence

# 2) First run (build, cert, keys, volumes) — detached
make up

# Alternatively, interactive logs for dev
make dev

# Bring everything down
make down
````

### Makefile Commands

> The project ships a `Makefile` (uses `compose.yaml`). Common targets:

| Target         | What it does                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `make up`      | Builds images and starts all services **in detached mode** (`prepare` → `docker compose -f compose.yaml up -d --build`).                                                |
| `make dev`     | Same as `up` but **foreground logs** (`docker compose up --build`).                                                                                                     |
| `make down`    | Stops and removes containers (`docker compose down`).                                                                                                                   |
| `make clean`   | Full teardown: containers, **volumes**, images; removes generated **keys** and certs.                                                                                   |
| `make prepare` | Runs `keys` + `cert` and creates `volume-data/…` directories.                                                                                                           |
| `make keys`    | Generates **RSA private/public** (root `private.pem`/`public.pem`), creates per‑service `config/keys/`, copies **private.pem** → `auth`, **public.pem** → all services. |
| `make cert`    | Executes `gencert.sh` to produce a **self‑signed TLS cert** for the gateway.                                                                                            |
| `make re`      | `down` then `up`.                                                                                                                                                       |

### Environment

> **Never commit secrets.** Keep all `.env` out of VCS. Rotate any leaked credentials.

Root `.env` (minimal):

```dotenv
# Global
DJANGO_SECRET_KEY=change-me
CONSISTENCY_TOKEN=change-me
FRONTEND_URL=https://localhost

# Email (optional)
EMAIL_HOST_USER=<smtp-user>
EMAIL_HOST_PASSWORD=<smtp-pass>

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin
RABBITMQ_VHOST=/
AMQP_ENABLED=true

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

### .env per service (examples)

**`auth/service/.env`**

```dotenv
DEBUG=True
DJANGO_SECRET_KEY=change-me

# Postgres
AUTHDB_NAME=authdb
AUTHDB_USER=authdbuser
AUTHDB_PASSWORD=authdbpass
AUTHDB_HOST=auth-postgres   # must match service name in compose
AUTHDB_PORT=5432

# SMTP (optional)
EMAIL_HOST_USER=<smtp-user>
EMAIL_HOST_PASSWORD=<smtp-pass>
```

**`social/service/.env`**

```dotenv
DEBUG=True
DJANGO_SECRET_KEY=change-me

SOCIALDB_NAME=socialdb
SOCIALDB_USER=socialdbuser
SOCIALDB_PASSWORD=socialdbpass
SOCIALDB_HOST=social-postgres
SOCIALDB_PORT=5432
```

**`pong/service/.env`**

```dotenv
DEBUG=True
DJANGO_SECRET_KEY=change-me

PONGDB_NAME=pongdb
PONGDB_USER=pongdbuser
PONGDB_PASSWORD=pongdbpass
PONGDB_HOST=pong-postgres
PONGDB_PORT=5432
```

**`chess/service/.env`**

```dotenv
DEBUG=True
DJANGO_SECRET_KEY=change-me

CHESSDB_NAME=chessdb
CHESSDB_USER=chessdbuser
CHESSDB_PASSWORD=chessdbpass
CHESSDB_HOST=chess-postgres
CHESSDB_PORT=5432
```

**`notifications/service/.env`**

```dotenv
DEBUG=True
DJANGO_SECRET_KEY=change-me

NOTIFICATIONSDB_NAME=notificationsdb
NOTIFICATIONSDB_USER=notificationsuser
NOTIFICATIONSDB_PASSWORD=notificationspass
NOTIFICATIONSDB_HOST=notifications-postgres
NOTIFICATIONSDB_PORT=5432
```

### Ports

| Service         | Port (local) |
| --------------- | ------------ |
| Gateway (HTTPS) | 5443         |
| Flower (Celery) | 5555         |
| RabbitMQ Mgmt   | 15672        |

> Ports may differ; check `compose.yaml`/`docker-compose.yml`.

## Security

* **JWT (RSA)**, stateless; CSRF/CORS hardened for REST; HTTPS fronted by Nginx.
* Password hashing (bcrypt/Argon2 per build); optional **2FA (TOTP)**.
* Dev uses self‑signed TLS; use proper certs, strong CORS, and rate‑limits in prod.

## Notes (Production)

* Replace self‑signed cert with a real one.
* Store secrets in a vault (not env/plain files).
* Harden DB/network, enable observability, backups & migrations policy.

## Contributing

* Fork → feature branch → PR. Follow clear commit messages (Conventional Commits recommended).
* Run lint/tests before PR (configure CI as needed).

## License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.
