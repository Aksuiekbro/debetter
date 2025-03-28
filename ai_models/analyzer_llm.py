import os
import torch
import openai
from openai import OpenAI
from dotenv import load_dotenv
from prompts import system_message_evaluation, generate_user_content 
from asr import TranscriptionModel
import prompts
import asr







load_dotenv()

class DebateEvaluator:
    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key)
        
        
        self.model_name = kwargs.get("model_name", "canary_1b_flash")
        self.device = kwargs.get("device", "cuda" if torch.cuda.is_available() else "cpu")
        
        
        self.transcription_model = TranscriptionModel(
            model_name=self.model_name,
            device=self.device
        )
        
        
        self.system_prompt = kwargs.get("system_prompt", system_message_evaluation)

    def get_transcribed_text(self, transcriptions_text):
        transcribed_text = ""
        for value in list(transcriptions_text.values()):
            transcribed_text += " " + value
        return transcribed_text.strip()

    def transcribe_audio(self, **kwargs):
        transcriptions_text, transcriptions_obj = self.transcription_model.transcribe_audio(**kwargs)
        return transcriptions_text

    def generate_messages(self, transcribed_text):
        return [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": generate_user_content(transcribed_text)},
        ]

    def get_response(self, messages):
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=messages
        )
        return response

    def evaluate_speech(self, **kwargs):        
        transcriptions_text = self.transcribe_audio(**kwargs)
        transcribed_text = self.get_transcribed_text(transcriptions_text)
        messages = self.generate_messages(transcribed_text)
        response = self.get_response(messages)
        return response

