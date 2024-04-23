# consumers.py
import json
import logging
import asyncio
import secrets
from channels.generic.websocket import AsyncWebsocketConsumer
import websockets

# Setting up logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class ChatConsumer(AsyncWebsocketConsumer):
    # Class variable to track all connected clients
    connected_clients = {}

    async def connect(self):
        self.unique_id = secrets.token_hex(16)  # Secure random hex token
        self.connected_clients[self.unique_id] = self

        logger.info(f"WebSocket client connected with ID: {self.unique_id}")
        await self.accept()

    async def disconnect(self, close_code):
        if self.unique_id in self.connected_clients:
            del self.connected_clients[self.unique_id]
        logger.info(f"WebSocket client {self.unique_id} disconnected with code: {close_code}")

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        logger.info(f"Received message from {self.unique_id}: {message}")
        await self.forward_message_to_llm(message)

    async def forward_message_to_llm(self, message):
        uri = "ws://llm:5000"
        try:
            async with websockets.connect(uri, timeout=10) as websocket:
                await websocket.send(json.dumps({'message': message}))
                logger.info(f"Message forwarded to LLM: {message}")

                response_data = await asyncio.wait_for(websocket.recv(), timeout=30)
                response_json = json.loads(response_data)

                if 'message' in response_json and 'audio_url' in response_json:
                    await self.send(text_data=json.dumps(response_json))
                else:
                    logger.error("Invalid response format from LLM server")
                    await self.error_message("Invalid response format from LLM server.")
        except asyncio.TimeoutError:
            logger.error("Timeout occurred while waiting for LLM response")
            await self.error_message("Timeout waiting for response from server.")
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            await self.error_message("An error occurred while processing your message.")

    async def error_message(self, error_detail):
        await self.send(text_data=json.dumps({
            'message': error_detail,
            'audio_url': 'No audio available'
        }))

    # Optional: method to broadcast messages to all connected clients
    @classmethod
    async def broadcast_message(cls, message):
        for client in cls.connected_clients.values():
            await client.send(text_data=json.dumps({
                'message': message
            }))

