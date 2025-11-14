#!/usr/bin/env bash
# Minimal illustrative LoRA fine-tuning script using HuggingFace PEFT.
# Requires: transformers, peft, datasets, accelerate, bitsandbytes
# NOTE: This is a template; adjust batch size for your GPU/CPU capacity.

set -euo pipefail

MODEL_NAME=${MODEL_NAME:-"meta-llama/Meta-Llama-3-8B-Instruct"}
DATA_FILE=${DATA_FILE:-"data/fine_tune/instructions.jsonl"}
OUTPUT_DIR=${OUTPUT_DIR:-"models/lora-policy"}
BATCH_SIZE=${BATCH_SIZE:-2}
GRAD_ACC=${GRAD_ACC:-8}
LR=${LR:-2e-4}
EPOCHS=${EPOCHS:-1}

python <<'PY'
import os, json
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model

model_name = os.getenv('MODEL_NAME', 'meta-llama/Meta-Llama-3-8B-Instruct')
data_file = os.getenv('DATA_FILE', 'data/fine_tune/instructions.jsonl')

raw = load_dataset('json', data_files=data_file, split='train')

def format_example(ex):
    return {'text': f"<s>[INST] {ex['instruction']} [/INST] {ex['output']}"}

ds = raw.map(format_example)

model = AutoModelForCausalLM.from_pretrained(model_name, device_map="auto")
tok = AutoTokenizer.from_pretrained(model_name)
if tok.pad_token is None:
    tok.pad_token = tok.eos_token

lora = LoraConfig(r=8, lora_alpha=16, target_modules=["q_proj","v_proj"], lora_dropout=0.05, bias="none", task_type="CAUSAL_LM")
model = get_peft_model(model, lora)

def tokenize(batch):
    return tok(batch['text'], truncation=True, max_length=2048)

tok_ds = ds.map(tokenize, batched=True, remove_columns=ds.column_names)

train_args = TrainingArguments(
    output_dir=os.getenv('OUTPUT_DIR','models/lora-policy'),
    per_device_train_batch_size=int(os.getenv('BATCH_SIZE','2')),
    gradient_accumulation_steps=int(os.getenv('GRAD_ACC','8')),
    learning_rate=float(os.getenv('LR','2e-4')),
    num_train_epochs=int(os.getenv('EPOCHS','1')),
    bf16=True,
    logging_steps=10,
    save_strategy='epoch'
)

trainer = Trainer(model=model, args=train_args, train_dataset=tok_ds)
trainer.train()
model.save_pretrained(os.getenv('OUTPUT_DIR','models/lora-policy'))
print('LoRA model saved.')
PY
