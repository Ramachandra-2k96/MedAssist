import speech_recognition as sr
import logging
import tempfile
import os
from typing import Optional, Tuple
from pydub import AudioSegment

logger = logging.getLogger(__name__)


def get_sphinx_language_code(lang: str) -> str:
    """
    Map our language codes to pocketsphinx language codes.
    Note: pocketsphinx has limited language support compared to browser speech recognition.
    For unsupported languages, we'll fall back to English.
    """
    # Pocketsphinx primarily supports English well, with some support for other languages
    # For production, you might want to use Google Speech API or other services for better language support
    sphinx_map = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-PT',
        'zh': 'zh-CN',
        # For languages without direct support, fall back to English
        'kn': 'en-US',  # Kannada not supported in sphinx, fallback to English
        'hi': 'en-US',  # Hindi not supported in sphinx, fallback to English
        'ar': 'en-US',  # Arabic not supported in sphinx, fallback to English
        'ja': 'en-US',  # Japanese not supported in sphinx, fallback to English
    }
    return sphinx_map.get(lang, 'en-US')


def get_google_language_code(lang: str) -> str:
    """Map our language codes to Google Speech-to-Text language codes."""
    google_map = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-BR',
        'hi': 'hi-IN',
        'kn': 'kn-IN',  # Google supports Kannada!
        'ar': 'ar-SA',
        'zh': 'zh-CN',
        'ja': 'ja-JP',
    }
    return google_map.get(lang, 'en-US')


def transcribe_audio(audio_blob: bytes, language: str = 'en') -> Tuple[Optional[str], Optional[str]]:
    """
    Transcribe audio using speech_recognition library.
    Tries Google Speech-to-Text API first (more accurate, free tier available).
    Falls back to pocketsphinx (offline) if Google fails.
    Converts any audio format to WAV before processing.
    
    Args:
        audio_blob: The audio file content as bytes (can be WebM, MP3, etc.)
        language: Language code (en, es, kn, etc.)
    
    Returns:
        Tuple of (transcription, error_message)
        - If successful: (transcription_text, None)
        - If failed: (None, error_message)
    """
    recognizer = sr.Recognizer()
    temp_input_path = None
    temp_wav_path = None
    
    try:
        # Create a temporary file to store the input audio
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
            temp_input_path = temp_file.name
            temp_file.write(audio_blob)
        
        # Convert to WAV format (required by speech_recognition)
        logger.info(f"Converting audio from {temp_input_path} to WAV format")
        
        try:
            # Load audio file (pydub can handle WebM, MP3, etc. if ffmpeg is installed)
            audio = AudioSegment.from_file(temp_input_path)
            
            # Convert to WAV with proper settings for speech recognition
            # 16kHz sample rate, mono channel, 16-bit
            audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
            
            # Export as WAV
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as wav_file:
                temp_wav_path = wav_file.name
            
            audio.export(temp_wav_path, format='wav')
            logger.info(f"Audio converted to WAV: {temp_wav_path}")
            
        except Exception as e:
            error_msg = f"Audio conversion failed: {str(e)}. Make sure ffmpeg is installed."
            logger.error(error_msg)
            return None, error_msg
        
        # Load the WAV file for speech recognition
        with sr.AudioFile(temp_wav_path) as source:
            # Adjust for ambient noise
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            # Record the audio data
            audio_data = recognizer.record(source)
        
        # Try Google Speech-to-Text first (more accurate, free tier: 60 min/month)
        google_lang = get_google_language_code(language)
        try:
            transcription = recognizer.recognize_google(audio_data, language=google_lang)
            logger.info(f"Successfully transcribed audio using Google Speech-to-Text (language: {language})")
            return transcription, None
        except sr.UnknownValueError:
            logger.warning("Google Speech-to-Text could not understand audio, trying pocketsphinx...")
        except sr.RequestError as e:
            logger.warning(f"Google Speech-to-Text API error: {str(e)}, trying pocketsphinx...")
        except Exception as e:
            logger.warning(f"Google Speech-to-Text failed: {str(e)}, trying pocketsphinx...")
        
        # Fallback to pocketsphinx (offline, lower accuracy)
        sphinx_lang = get_sphinx_language_code(language)
        try:
            transcription = recognizer.recognize_sphinx(audio_data, language=sphinx_lang)
            logger.info(f"Successfully transcribed audio using pocketsphinx (language: {language})")
            return transcription, None
        except sr.UnknownValueError:
            error_msg = "Could not understand audio - no speech detected"
            logger.warning(f"Transcription failed: {error_msg}")
            return None, error_msg
        except sr.RequestError as e:
            error_msg = f"Sphinx error: {str(e)}"
            logger.error(f"Transcription failed: {error_msg}")
            return None, error_msg
            
    except Exception as e:
        error_msg = f"Error processing audio: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return None, error_msg
    
    finally:
        # Clean up temporary files
        for path in [temp_input_path, temp_wav_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except Exception as e:
                    logger.warning(f"Failed to delete temp file {path}: {e}")


def transcribe_audio_from_url(audio_url: str, language: str = 'en') -> Tuple[Optional[str], Optional[str]]:
    """
    Download audio from URL and transcribe it.
    
    Args:
        audio_url: URL to the audio file (GCS URL)
        language: Language code
    
    Returns:
        Tuple of (transcription, error_message)
    """
    import requests
    
    try:
        # Download the audio file
        response = requests.get(audio_url, timeout=30)
        response.raise_for_status()
        
        # Transcribe the downloaded audio
        return transcribe_audio(response.content, language)
        
    except Exception as e:
        error_msg = f"Error downloading audio from URL: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return None, error_msg
