# PayAid V3 Scratch – self-hosted stack
# Run from: payaid-v3-scratch/

.PHONY: up-core up-ai down

up-core:
	docker compose up -d db redis n8n

up-ai:
	docker compose --profile ai up -d

down:
	docker compose --profile ai down
