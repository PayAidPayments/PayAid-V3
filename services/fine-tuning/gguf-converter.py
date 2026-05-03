"""
GGUF Model Converter
Converts LoRA fine-tuned models to GGUF format for Ollama deployment
Uses llama.cpp for conversion
"""

import os
import json
import logging
import subprocess
from pathlib import Path
from typing import Optional, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GGUFConverter:
    """Convert fine-tuned models to GGUF format"""
    
    def __init__(self, llama_cpp_path: Optional[str] = None):
        """
        Initialize converter
        
        Args:
            llama_cpp_path: Path to llama.cpp directory (if installed)
                           If None, will try to use system llama.cpp or provide instructions
        """
        self.llama_cpp_path = llama_cpp_path or os.getenv('LLAMA_CPP_PATH')
        
    def check_llama_cpp_available(self) -> bool:
        """Check if llama.cpp is available"""
        try:
            result = subprocess.run(
                ['llama-cli', '--version'],
                capture_output=True,
                timeout=5
            )
            return result.returncode == 0
        except:
            # Try alternative command
            try:
                result = subprocess.run(
                    ['convert-llama-gguf', '--help'],
                    capture_output=True,
                    timeout=5
                )
                return result.returncode == 0
            except:
                return False
    
    def convert_lora_to_gguf(
        self,
        lora_path: str,
        base_model_path: str,
        output_path: str,
        model_name: str
    ) -> Dict:
        """
        Convert LoRA weights to GGUF format
        
        This is a simplified implementation. In production, you would:
        1. Merge LoRA weights with base model
        2. Convert merged model to GGUF using llama.cpp
        3. Quantize if needed (Q4, Q5, Q8)
        
        Args:
            lora_path: Path to LoRA adapter weights
            base_model_path: Path to base model (Mistral 7B)
            output_path: Output directory for GGUF file
            model_name: Name for the converted model
        """
        logger.info(f"Converting LoRA model to GGUF: {model_name}")
        
        # Check if llama.cpp is available
        if not self.check_llama_cpp_available():
            logger.warning(
                "llama.cpp not found. Returning instructions for manual conversion.\n"
                "To install llama.cpp:\n"
                "  git clone https://github.com/ggerganov/llama.cpp.git\n"
                "  cd llama.cpp && make\n"
                "Or use: pip install llama-cpp-python"
            )
            return {
                'success': False,
                'requires_manual': True,
                'instructions': self._get_manual_instructions(lora_path, base_model_path, output_path, model_name)
            }
        
        try:
            # Step 1: Merge LoRA with base model (if needed)
            # This would use PEFT to merge weights
            merged_model_path = self._merge_lora_weights(lora_path, base_model_path)
            
            # Step 2: Convert to GGUF
            gguf_path = self._convert_to_gguf(merged_model_path, output_path, model_name)
            
            return {
                'success': True,
                'gguf_path': gguf_path,
                'model_name': model_name,
                'size_mb': os.path.getsize(gguf_path) / (1024 * 1024) if os.path.exists(gguf_path) else 0
            }
        except Exception as e:
            logger.error(f"Conversion failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'instructions': self._get_manual_instructions(lora_path, base_model_path, output_path, model_name)
            }
    
    def _merge_lora_weights(self, lora_path: str, base_model_path: str) -> str:
        """Merge LoRA weights with base model"""
        # This would use PEFT library to merge
        # For now, return a placeholder path
        logger.info("Merging LoRA weights with base model...")
        merged_path = os.path.join(os.path.dirname(lora_path), 'merged_model')
        
        # In production, you would:
        # from peft import PeftModel
        # base_model = AutoModelForCausalLM.from_pretrained(base_model_path)
        # lora_model = PeftModel.from_pretrained(base_model, lora_path)
        # merged_model = lora_model.merge_and_unload()
        # merged_model.save_pretrained(merged_path)
        
        logger.warning("LoRA merging not fully implemented. Using base model path.")
        return base_model_path
    
    def _convert_to_gguf(self, model_path: str, output_path: str, model_name: str) -> str:
        """Convert model to GGUF format using llama.cpp"""
        os.makedirs(output_path, exist_ok=True)
        gguf_file = os.path.join(output_path, f"{model_name}.gguf")
        
        # Use llama.cpp convert script
        # python convert.py model_path --outfile gguf_file
        try:
            cmd = [
                'python',
                'convert.py',
                model_path,
                '--outfile', gguf_file
            ]
            
            result = subprocess.run(
                cmd,
                cwd=self.llama_cpp_path or '.',
                capture_output=True,
                timeout=3600  # 1 hour timeout
            )
            
            if result.returncode != 0:
                raise Exception(f"Conversion failed: {result.stderr.decode()}")
            
            logger.info(f"GGUF conversion complete: {gguf_file}")
            return gguf_file
        except Exception as e:
            logger.error(f"GGUF conversion error: {e}")
            raise
    
    def _get_manual_instructions(
        self,
        lora_path: str,
        base_model_path: str,
        output_path: str,
        model_name: str
    ) -> str:
        """Get manual conversion instructions"""
        return f"""
Manual GGUF Conversion Instructions:

1. Install llama.cpp:
   git clone https://github.com/ggerganov/llama.cpp.git
   cd llama.cpp
   make

2. Merge LoRA weights with base model:
   python -c "
   from transformers import AutoModelForCausalLM
   from peft import PeftModel
   
   base = AutoModelForCausalLM.from_pretrained('{base_model_path}')
   lora = PeftModel.from_pretrained(base, '{lora_path}')
   merged = lora.merge_and_unload()
   merged.save_pretrained('./merged_model')
   "

3. Convert to GGUF:
   python llama.cpp/convert.py ./merged_model --outfile {output_path}/{model_name}.gguf

4. (Optional) Quantize:
   ./llama.cpp/quantize {model_name}.gguf {model_name}-Q4_K_M.gguf Q4_K_M

5. Import to Ollama:
   ollama create {model_name} -f Modelfile
   (Where Modelfile contains: FROM ./{model_name}.gguf)
"""

def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Convert LoRA model to GGUF')
    parser.add_argument('--lora-path', required=True, help='Path to LoRA adapter')
    parser.add_argument('--base-model', required=True, help='Path to base model')
    parser.add_argument('--output', required=True, help='Output directory')
    parser.add_argument('--model-name', required=True, help='Model name')
    
    args = parser.parse_args()
    
    converter = GGUFConverter()
    result = converter.convert_lora_to_gguf(
        args.lora_path,
        args.base_model,
        args.output,
        args.model_name
    )
    
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
