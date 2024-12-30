import os
import logging
from openai import OpenAI
from dotenv import load_dotenv
from portkey_ai import PORTKEY_GATEWAY_URL, createHeaders
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

logger.info("Starting speech-to-text application")

logger.info("Initializing OpenAI client")
client = OpenAI(
    base_url=PORTKEY_GATEWAY_URL,
    default_headers=createHeaders(api_key = os.getenv("PORTKEY_API_KEY"),
                                  virtual_key = "openai-prod-a5528d"
                                  )
)
logger.info("OpenAI client initialized")

template = """KrooAi is a Artificial Intelligence model by kroolo.

If user say kroo or Any mention of krooo , kro , crew , lu its refereing to you. 

Kroo is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.

Any mention of Krullu, kroolo , oloo , Krulu,screw, Krullo low or any variation thereof, means its kroolo. The spelling in the response should always be kroolo.
kroolo is a Ai powered productivity tool , it helps users manage their tasks efficientlyand streamline workflows by automating repetitive tasks. kroolo helps manage projects docs , has ai agents and integrates with various third-party applications to enhance productivity.
Kroo is kroolo's Ai assistantthat can assist users in various tasks, enhancing their productivity and efficiency.

Kroo is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of topics.

Overall, kroo is a powerful tool that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.

Kroo is aware that human input is being transcribed from audio and as such there may be some errors in the transcription. It will attempt to account for some words being swapped with similar-sounding words or phrases. Assistant will also keep responses concise, because human attention spans are more limited over the audio channel since it takes time to listen to a response.

Human: {human_input}
Assistant:"""

prompt = ChatPromptTemplate.from_template(template=template)

# Voice mapping for OpenAI TTS
VOICE_MAPPING = {
    "default": "echo",
    "male": "onyx",
    "female": "nova"
}

async def stream_tts_response(text, voice="default"):
    mapped_voice = VOICE_MAPPING.get(voice, "echo")
    logger.info(f"Streaming TTS response with voice: {mapped_voice}")
    try:
        response = await client.audio.speech.create(
            model="tts-1",
            voice=mapped_voice,
            input=text,
        )
        content = response.content
        if isinstance(content, bytes):
            return content
        elif hasattr(content, 'read'):
            return content.read()
        else:
            logger.error(f"Unexpected content type: {type(content)}")
            return b""
    except Exception as e:
        logger.error(f"Error in TTS streaming: {str(e)}")
        return b""

logger.info("TTS streaming function initialized")

if __name__ == "__main__":
    logger.info("This module is now designed to be imported, not run directly.")
