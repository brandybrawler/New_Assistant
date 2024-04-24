import json
import logging
import asyncio
import secrets
import base64
from io import BytesIO
from gtts import gTTS
from channels.generic.websocket import AsyncWebsocketConsumer
import websockets

# Setting up logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class ChatConsumer(AsyncWebsocketConsumer):
    # Class variable to track all connected clients
    connected_clients = {}

    async def connect(self):
        self.unique_id = secrets.token_hex(16)
        self.connected_clients[self.unique_id] = self
        logger.info(f"WebSocket client connected with ID: {self.unique_id}. Total connected clients: {len(self.connected_clients)}")
        await self.accept()

    async def disconnect(self, close_code):
        if self.unique_id in self.connected_clients:
            del self.connected_clients[self.unique_id]
        logger.info(f"WebSocket client {self.unique_id} disconnected with code: {close_code}. Total remaining clients: {len(self.connected_clients)}")

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        logger.info(f"Received message from {self.unique_id}: {message}")
        await self.forward_message_to_websocket(message)

    async def forward_message_to_websocket(self, message):
        uri = "wss://core.proximaai.co/ws/chat/"
        tenant_name = "Proxima Agents Limited"
        payload = {"tenant_name": tenant_name, "question": message}
        logger.info(f"Forwarding message to {uri} with payload: {payload}")
        full_response = ""
        try:
            async with websockets.connect(uri, timeout=10) as websocket:
                await websocket.send(json.dumps(payload))
                logger.info(f"Message sent to WebSocket: {payload}")

                while True:
                    response_data = await websocket.recv()
                    logger.info(f"Received response from websocket: {response_data}")

                    resp_json = json.loads(response_data)
                    token = resp_json.get('token', '').strip()
                    if not token:
                        logger.info("Empty token received, ending the loop.")
                        break

                    if token not in ['\n', '```', '}', '"', "'", '``']:  # Filtering out unwanted characters/tokens
                        if token.endswith(('.', '!', '?', ',')):
                            full_response += token + " " if full_response and full_response[-1] != ' ' else token
                        else:
                            full_response += token + " "

                # Remove the trailing quotation mark
                full_response = full_response.strip().rstrip('"')

                logger.info(f"Complete sentence: {full_response}")

                # Convert full_response to audio and encode it in base64
                if full_response:
                    try:
                        logger.info(f"Generating audio from text. Text length: {len(full_response)} characters")
                        audio = gTTS(text=full_response.strip(), lang='en', slow=False)
                        with BytesIO() as audio_fp:
                            audio.write_to_fp(audio_fp)
                            audio_fp.seek(0)
                            base64_audio = base64.b64encode(audio_fp.read()).decode('utf-8')
                        logger.info(f"Audio conversion complete. Audio data size: {len(base64_audio)} bytes")
                        
                        # Send the JSON response with both the message and audio URL
                        await self.send(text_data=json.dumps({'message': full_response.strip(), 'audio_url': f"data:audio/mp3;base64,{base64_audio}"}))
                    except Exception as e:
                        logger.error(f"Error generating audio: {e}")


        except asyncio.TimeoutError:
            logger.error("Timeout occurred while waiting for WebSocket response")
            await self.error_message("Timeout waiting for response from server.")
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            await self.error_message("An error occurred while processing your message.")


    async def error_message(self, error_detail):
        await self.send(text_data=json.dumps({
            'message': error_detail,
            'audio_url': 'No audio available'
        }))

    @classmethod
    async def broadcast_message(cls, message):
        logger.info(f"Broadcasting message to {len(cls.connected_clients)} clients.")
        for client in cls.connected_clients.values():
            await client.send(text_data=json.dumps({'message': message}))
            logger.info(f"Message sent to client ID: {client.unique_id}")
