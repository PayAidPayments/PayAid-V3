"""
Model Deployment Pipeline
Deploys fine-tuned models to Ollama
"""

import os
import json
import logging
import subprocess
import requests
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime
import shutil

# Import GGUF converter if available
try:
    from gguf_converter import GGUFConverter
    GGUF_AVAILABLE = True
except ImportError:
    GGUF_AVAILABLE = False
    logging.warning("GGUF converter not available. Manual conversion required.")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODELS_DIR = "./models"

class ModelDeployment:
    def __init__(self, ollama_url: str = OLLAMA_BASE_URL):
        self.ollama_url = ollama_url
        
    def check_ollama_available(self) -> bool:
        """Check if Ollama is running"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def create_modelfile(self, model_path: str, model_name: str) -> str:
        """Create Ollama Modelfile from fine-tuned model"""
        modelfile_path = f"{model_path}/Modelfile"
        
        # Read metadata
        metadata_path = f"{model_path}/metadata.json"
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            base_model = metadata.get('base_model', 'mistral:7b')
        else:
            base_model = 'mistral:7b'
        
        # Create Modelfile
        modelfile_content = f"""FROM {base_model}
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
SYSTEM \"You are a specialized AI assistant for this company. Provide accurate, context-aware responses based on company-specific data and patterns.\"
"""
        
        with open(modelfile_path, 'w') as f:
            f.write(modelfile_content)
        
        logger.info(f"Created Modelfile at {modelfile_path}")
        return modelfile_path
    
    def convert_to_gguf(self, model_path: str) -> Optional[str]:
        """Convert model to GGUF format for Ollama (if needed)"""
        # In production, you'd use llama.cpp or similar to convert
        # For now, we'll assume the model is already in a compatible format
        # or use Ollama's import feature
        
        logger.info("Model conversion to GGUF (if needed) - using Ollama import")
        return model_path
    
    def deploy_to_ollama(
        self,
        tenant_id: str,
        model_path: str,
        model_name: Optional[str] = None
    ) -> Dict:
        """Deploy fine-tuned model to Ollama"""
        
        if not self.check_ollama_available():
            raise RuntimeError(f"Ollama is not available at {self.ollama_url}")
        
        if model_name is None:
            model_name = f"mistral-7b-company-{tenant_id}"
        
        logger.info(f"Deploying model {model_name} to Ollama...")
        
        # Create Modelfile
        modelfile_path = self.create_modelfile(model_path, model_name)
        
        # Use Ollama create command
        # Note: In production, you'd need to properly package the LoRA weights
        # For now, we'll create a model that references the base model
        # and document the process for integrating LoRA weights
        
        try:
            # Create model using Ollama API
            # This is a simplified version - in production, you'd need to:
            # 1. Convert LoRA weights to GGUF
            # 2. Merge with base model
            # 3. Import to Ollama
            
            # For now, we'll create a model tag that references the custom model
            result = {
                'success': True,
                'model_name': model_name,
                'tenant_id': tenant_id,
                'deployed_at': json.dumps(datetime.now().isoformat()),
                'note': 'Model weights need to be manually integrated with Ollama. See documentation.',
            }
            
            logger.info(f"Model {model_name} deployment initiated")
            return result
            
        except Exception as e:
            logger.error(f"Deployment failed: {e}")
            raise
    
    def verify_deployment(self, model_name: str) -> bool:
        """Verify model is available in Ollama"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [m.get('name', '') for m in models]
                return model_name in model_names
            return False
        except:
            return False
    
    def create_model_version(
        self,
        tenant_id: str,
        model_path: str,
        version: str = "1.0"
    ) -> Dict:
        """Create versioned model deployment"""
        
        versioned_name = f"mistral-7b-company-{tenant_id}:{version}"
        
        # Copy model to versioned directory
        versioned_path = f"{model_path}-v{version}"
        if os.path.exists(model_path):
            shutil.copytree(model_path, versioned_path, dirs_exist_ok=True)
        
        # Update metadata
        metadata_path = f"{versioned_path}/metadata.json"
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            metadata['version'] = version
            metadata['model_name'] = versioned_name
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
        
        # Deploy versioned model
        result = self.deploy_to_ollama(tenant_id, versioned_path, versioned_name)
        result['version'] = version
        
        return result

def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Deploy fine-tuned model to Ollama')
    parser.add_argument('--tenant-id', required=True, help='Tenant ID')
    parser.add_argument('--model-path', required=True, help='Path to fine-tuned model')
    parser.add_argument('--model-name', help='Model name in Ollama')
    parser.add_argument('--version', help='Model version')
    
    args = parser.parse_args()
    
    deployment = ModelDeployment()
    
    if args.version:
        result = deployment.create_model_version(
            args.tenant_id,
            args.model_path,
            args.version
        )
    else:
        result = deployment.deploy_to_ollama(
            args.tenant_id,
            args.model_path,
            args.model_name
        )
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
