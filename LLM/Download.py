from flask import Flask
from pathlib import Path
from gpt4all import GPT4All
import tracemalloc


app = Flask(__name__)
tracemalloc.start()

current_directory = Path.cwd()
model_path = current_directory / "Chat_Models"
model_path.mkdir(parents=True, exist_ok=True)

model_name = 'gpt4all-falcon-newbpe-q4_0.gguf'
#Other models include:
# wizardlm-13b-v1.2.Q4_0.gguf           #really huge model(have not tried it so far)
# mistral-7b-openorca.gguf2.Q4_0.gguf       #fast and uncensored, best for chat based conversations
# gpt4all-falcon-newbpe-q4_0.gguf       #fastest model overall, instruction based
# orca-mini-3b-gguf2-q4_0.gguf      #dumbest model

model = GPT4All(model_name, model_path=model_path)

if __name__ == '__main__':
    app.run(host='localhost', port=8089)