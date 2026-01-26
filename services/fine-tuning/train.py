"""
LoRA Fine-Tuning Service for Company-Specific Models
Uses HuggingFace PEFT to fine-tune Mistral 7B
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from peft import LoraConfig, get_peft_model, TaskType
from datasets import Dataset
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
BASE_MODEL = "mistralai/Mistral-7B-v0.1"  # Or use local Ollama model path
OUTPUT_DIR = "./models"
MAX_SEQ_LENGTH = 512
LORA_R = 16
LORA_ALPHA = 32
LORA_DROPOUT = 0.05
TARGET_MODULES = ["q_proj", "v_proj", "k_proj", "o_proj"]

class FineTuningService:
    def __init__(self, base_model: str = BASE_MODEL):
        self.base_model = base_model
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
    def load_training_data(self, data_path: str) -> List[Dict]:
        """Load training data from JSONL or JSON file"""
        data = []
        
        if data_path.endswith('.jsonl'):
            with open(data_path, 'r', encoding='utf-8') as f:
                for line in f:
                    data.append(json.loads(line))
        elif data_path.endswith('.json'):
            with open(data_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            raise ValueError(f"Unsupported file format: {data_path}")
        
        logger.info(f"Loaded {len(data)} training examples")
        return data
    
    def format_training_data(self, data: List[Dict]) -> Dataset:
        """Format data for training"""
        formatted = []
        
        for item in data:
            prompt = item.get('prompt', '')
            completion = item.get('completion', '')
            
            # Format as instruction-following prompt
            text = f"### Instruction:\n{prompt}\n\n### Response:\n{completion}\n\n### End"
            
            formatted.append({
                'text': text,
                'prompt': prompt,
                'completion': completion,
            })
        
        return Dataset.from_list(formatted)
    
    def setup_lora(self, model):
        """Setup LoRA configuration"""
        lora_config = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            r=LORA_R,
            lora_alpha=LORA_ALPHA,
            lora_dropout=LORA_DROPOUT,
            target_modules=TARGET_MODULES,
            bias="none",
        )
        
        model = get_peft_model(model, lora_config)
        model.print_trainable_parameters()
        
        return model
    
    def tokenize_function(self, examples, tokenizer):
        """Tokenize training examples"""
        return tokenizer(
            examples['text'],
            truncation=True,
            max_length=MAX_SEQ_LENGTH,
            padding="max_length",
        )
    
    def train(
        self,
        tenant_id: str,
        training_data_path: str,
        output_dir: Optional[str] = None,
        epochs: int = 3,
        batch_size: int = 4,
        learning_rate: float = 2e-4,
    ) -> Dict:
        """Fine-tune model for a specific company"""
        
        if output_dir is None:
            output_dir = f"{OUTPUT_DIR}/{tenant_id}"
        
        os.makedirs(output_dir, exist_ok=True)
        
        logger.info(f"Starting fine-tuning for tenant: {tenant_id}")
        
        # Load training data
        data = self.load_training_data(training_data_path)
        
        if len(data) < 100:
            raise ValueError(f"Insufficient training data: {len(data)} examples (minimum 100 required)")
        
        # Format data
        dataset = self.format_training_data(data)
        
        # Load model and tokenizer
        logger.info(f"Loading base model: {self.base_model}")
        tokenizer = AutoTokenizer.from_pretrained(self.base_model)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        model = AutoModelForCausalLM.from_pretrained(
            self.base_model,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            device_map="auto" if self.device == "cuda" else None,
        )
        
        # Setup LoRA
        model = self.setup_lora(model)
        
        # Tokenize dataset
        tokenized_dataset = dataset.map(
            lambda x: self.tokenize_function(x, tokenizer),
            batched=True,
            remove_columns=dataset.column_names,
        )
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=epochs,
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=4,
            learning_rate=learning_rate,
            fp16=self.device == "cuda",
            logging_steps=10,
            save_steps=100,
            evaluation_strategy="no",
            save_total_limit=2,
            load_best_model_at_end=False,
            report_to="none",
        )
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False,
        )
        
        # Trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
            data_collator=data_collator,
        )
        
        # Train
        logger.info("Starting training...")
        train_result = trainer.train()
        
        # Save model
        logger.info(f"Saving model to {output_dir}")
        trainer.save_model()
        tokenizer.save_pretrained(output_dir)
        
        # Save training metadata
        metadata = {
            'tenant_id': tenant_id,
            'base_model': self.base_model,
            'training_examples': len(data),
            'epochs': epochs,
            'batch_size': batch_size,
            'learning_rate': learning_rate,
            'trained_at': datetime.now().isoformat(),
            'train_loss': train_result.training_loss,
        }
        
        with open(f"{output_dir}/metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Fine-tuning complete! Model saved to {output_dir}")
        
        return {
            'success': True,
            'output_dir': output_dir,
            'metadata': metadata,
        }

def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fine-tune model for company')
    parser.add_argument('--tenant-id', required=True, help='Tenant ID')
    parser.add_argument('--data', required=True, help='Path to training data (JSONL or JSON)')
    parser.add_argument('--output-dir', help='Output directory for model')
    parser.add_argument('--epochs', type=int, default=3, help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=4, help='Batch size')
    parser.add_argument('--learning-rate', type=float, default=2e-4, help='Learning rate')
    
    args = parser.parse_args()
    
    service = FineTuningService()
    result = service.train(
        tenant_id=args.tenant_id,
        training_data_path=args.data,
        output_dir=args.output_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
    )
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
