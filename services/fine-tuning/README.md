# Fine-Tuning Service

LoRA fine-tuning service for company-specific AI models.

## Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Ensure you have:**
   - Python 3.8+
   - CUDA-capable GPU (recommended) or CPU
   - HuggingFace account (for model access)
   - Ollama running (for deployment)

## Training

```bash
python train.py \
  --tenant-id company-123 \
  --data data/company-123-training.jsonl \
  --epochs 3 \
  --batch-size 4 \
  --learning-rate 2e-4
```

## Deployment

```bash
python deploy.py \
  --tenant-id company-123 \
  --model-path models/company-123 \
  --version 1.0
```

## Model Versioning

Models are versioned automatically. Deploy new versions:

```bash
python deploy.py \
  --tenant-id company-123 \
  --model-path models/company-123 \
  --version 2.0
```

## Integration with Ollama

After deployment, models are available in Ollama as:
- `mistral-7b-company-{tenantId}` (latest)
- `mistral-7b-company-{tenantId}:{version}` (versioned)

Use in API:
```typescript
const model = await routeToModel(tenantId)
// Returns: { useCustomModel: true, modelName: "mistral-7b-company-123" }
```
