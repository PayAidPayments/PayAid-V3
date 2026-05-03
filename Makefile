# PayAid V3 – Self-hosted stack (Phase 0)
# Usage: make up-core | up-ai | down

COMPOSE = docker compose -f docker-compose.selfhosted.yml

.PHONY: up-core up-ai up down logs

# Core: postgres, redis, minio, n8n, onlyoffice (no AI)
up-core:
	$(COMPOSE) up -d postgres redis minio n8n onlyoffice

# Full AI stack: core + ollama, openwebui, chroma
up-ai:
	$(COMPOSE) --profile ai up -d

# All services (core + AI)
up:
	$(COMPOSE) --profile ai up -d

down:
	$(COMPOSE) --profile ai down

logs:
	$(COMPOSE) logs -f --tail=200

# Pre-pull Ollama models (run after ollama is up)
ollama-pull:
	docker exec payaid-ollama ollama pull llama3.2
	docker exec payaid-ollama ollama pull whisper-large-v3
