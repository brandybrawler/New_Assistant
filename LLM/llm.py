import asyncio
import json
import logging
import websockets
from gpt4all import GPT4All
from pathlib import Path
from gtts import gTTS
import base64
from io import BytesIO
from datetime import datetime
import re
import geocoder
from timezonefinder import TimezoneFinder
from pytz import timezone

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

global_model = None

def init_model(model_name, model_path, device="cpu"):
    import os
    from tensorflow.python.client import device_lib
    if device == "gpu" and any('GPU' in x.device_type for x in device_lib.list_local_devices()):
        device = "gpu"
    logger.info(f"Initializing model on {device}.")
    model = GPT4All(
        model_name=model_name,
        model_path=model_path,
        allow_download=True,
        n_ctx=2048,
        ngl=100,
        verbose=True,
        device=device
    )
    return model

async def load_model():
    logger.info("Starting model loading.")
    current_directory = Path(__file__).parent
    model_path = current_directory / "Chat_Models"
    model_path.mkdir(parents=True, exist_ok=True)
    model_name = 'orca-mini-3b-gguf2-q4_0.gguf'
    global global_model
    global_model = init_model(model_name, str(model_path))
    logger.info("Model loaded successfully.")

def get_local_timezone():
    """Retrieve the local timezone based on the current IP location."""
    g = geocoder.ip('me')
    lat, lon = g.latlng
    tf = TimezoneFinder()
    local_tz_name = tf.timezone_at(lat=lat, lng=lon)
    return timezone(local_tz_name)

def get_current_date():
    """Return the current date in the local timezone."""
    local_tz = get_local_timezone()
    return datetime.now(local_tz).strftime("Today's date is %Y-%m-%d")

def get_current_time():
    """Return the current time in the local timezone."""
    local_tz = get_local_timezone()
    return datetime.now(local_tz).strftime("The current time is %H:%M:%S")

def get_weather():
    return "The current weather in your location is sunny, 23°C."

def match_command(message):
    # Enhanced patterns with specific triggers
    command_patterns = {
        'date': r"\b(tell me the date|what is the date today|date today)\b",
        'time': r"\b(what time is it|current time|tell me the time)\b",
        'weather': r"\b(what's the weather like|tell me the weather|weather forecast)\b"
    }
    functions = {
        'date': get_current_date,
        'time': get_current_time,
        'weather': get_weather
    }

    for key, pattern in command_patterns.items():
        if re.search(pattern, message, re.IGNORECASE):
            return functions[key]()

    return None

async def handle_connection(websocket, path):
    logger.info("WebSocket client connected.")
    if not global_model:
        logger.warning("Model is still loading.")
        await websocket.send(json.dumps({'message': 'Model is still loading, please wait...'}))
        return

    try:
        async for message in websocket:
            data = json.loads(message)
            user_message = data['message'].lower()
            logger.info(f"Received message: {user_message}")

            command_response = match_command(user_message)
            if command_response:
                response = command_response
                audio = await generate_audio_response(response)
            else:
                response, audio = await process_message(user_message)

            await websocket.send(json.dumps({'message': response, 'audio_url': audio}))
    except websockets.exceptions.ConnectionClosed as e:
        logger.info(f"Connection with client closed: {e}")
    except Exception as e:
        logger.error(f"Error during connection handling: {e}")
        await send_error_message(websocket, "An error occurred on the server.")

async def process_message(message):
    system_template = 'Your name is ProximaAi Assistant, and you are a helpful assistant created by Proxima.Proxima is is an AI company. \n'
    prompt_template = 'USER: {0}\nASSISTANT: '
    prompt = system_template + prompt_template.format(message)

    try:
        response = global_model.generate(prompt, max_tokens=200, temp=0.7, top_k=40, top_p=0.4, min_p=0.0, repeat_penalty=1.18, repeat_last_n=64, n_batch=8, streaming=False)
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        return "An error occurred while generating the response.", ""
    audio = await generate_audio_response(response)
    return response, audio


async def generate_audio_response(text):
    try:
        tts = gTTS(text=text, lang='en')
        with BytesIO() as mp3_fp:
            tts.write_to_fp(mp3_fp)
            mp3_data = base64.b64encode(mp3_fp.getvalue()).decode('utf-8')
        return f"data:audio/mp3;base64,{mp3_data}"
    except Exception as e:
        logger.error(f"Error generating audio: {e}")
        return ""

async def send_error_message(websocket, message):
    await websocket.send(json.dumps({'message': message, 'audio_url': ''}))

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(load_model())
    start_server = websockets.serve(handle_connection, '0.0.0.0', 5000)
    loop.run_until_complete(start_server)
    loop.run_forever()
