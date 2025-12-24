#!/bin/bash
# Download AI Models Script (Linux/Mac)
# Downloads all required models for AI services

echo "🚀 Starting AI Models Download..."

models=(
    "text-to-image:stabilityai/stable-diffusion-xl-base-1.0"
    "text-to-speech:tts_models/multilingual/multi-dataset/xtts_v2"
    "speech-to-text:openai/whisper-large-v3"
    "image-to-image:stabilityai/stable-diffusion-xl-base-1.0"
    "image-to-text:Salesforce/blip-2-opt-2.7b"
)

total=${#models[@]}
current=0

for model_entry in "${models[@]}"; do
    IFS=':' read -r service model <<< "$model_entry"
    current=$((current + 1))
    
    echo ""
    echo "[$current/$total] Downloading: $model for $service"
    
    # Create service directory
    service_dir="models/$service"
    mkdir -p "$service_dir"
    
    # Download using huggingface-cli or git lfs
    if command -v huggingface-cli &> /dev/null; then
        echo "  Using huggingface-cli..."
        huggingface-cli download "$model" --local-dir "$service_dir/$model" --local-dir-use-symlinks False
    elif command -v git &> /dev/null; then
        echo "  Using git lfs..."
        model_path="$service_dir/$model"
        if [ ! -d "$model_path" ]; then
            git clone "https://huggingface.co/$model" "$model_path"
        else
            echo "  Model already exists, skipping..."
        fi
    else
        echo "  ⚠️  Neither huggingface-cli nor git found. Please install one:"
        echo "     pip install huggingface-hub"
        echo "     OR install git with git-lfs"
    fi
done

echo ""
echo "✅ Model download complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start services: docker-compose -f docker-compose.ai-services.yml up -d"
echo "   2. Check health: curl http://localhost:8000/health"
echo "   3. View logs: docker-compose -f docker-compose.ai-services.yml logs -f"
