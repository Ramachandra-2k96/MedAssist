import re
import boto3
from twilio.rest import Client
from django.conf import settings
import logging

logger = logging.getLogger('accounts.cron')

def send_sms(message_text: str, recipient: str) -> str:
    """
    Sends SMS via available service (Twilio or AWS SNS).
    Priority: Twilio if available, otherwise AWS SNS if available.

    Args:
        message_text (str): The SMS text content.
        recipient (str): The recipient's phone number.

    Returns:
        str: Message SID/MessageId upon successful send.
    """

    # Normalize phone number format
    recipient = re.sub(r'\D', '', recipient)
    if not recipient.startswith("91"):
        recipient = "91" + recipient
    recipient = "+" + recipient

    logger.info(f"Attempting to send SMS to {recipient}: {message_text[:50]}...")

    # Check if Twilio credentials are available using direct attribute access
    try:
        tw_sid = settings.TWILIO_ACCOUNT_SID
        tw_auth = settings.TWILIO_AUTH_TOKEN
        tw_from = settings.TWILIO_FROM_NUMBER
        twilio_available = bool(tw_sid and tw_auth and tw_from)
    except Exception:
        twilio_available = False

    logger.info(f"Twilio available: {twilio_available}")

    twilio_exception = None
    if twilio_available:
        try:
            # Use Twilio
            client = Client(tw_sid, tw_auth)
            msg = client.messages.create(
                body=message_text,
                from_=tw_from,
                to=recipient
            )
            logger.info(f"SMS sent via Twilio to {recipient}: {msg.sid}")
            return msg.sid

        except Exception as e:
            twilio_exception = e
            logger.exception("Twilio SMS failed")
            # Fall back to AWS if Twilio fails

    # Check if AWS credentials are available using direct attribute access
    try:
        aws_key = settings.AWS_ACCESS_KEY_ID
        aws_secret = settings.AWS_SECRET_ACCESS_KEY
        aws_region = settings.AWS_REGION
        aws_available = bool(aws_key and aws_secret and aws_region)
    except Exception:
        aws_available = False

    logger.info(f"AWS available: {aws_available}")
    if aws_available:
        logger.info("AWS Region is configured")

    aws_exception = None
    if aws_available:
        try:
            # Use AWS SNS
            sns_client = boto3.client(
                "sns",
                aws_access_key_id=aws_key,
                aws_secret_access_key=aws_secret,
                region_name=aws_region
            )

            response = sns_client.publish(
                PhoneNumber=recipient,
                Message=message_text,
                MessageAttributes={
                    'AWS.SNS.SMS.SMSType': {
                        'DataType': 'String',
                        'StringValue': 'Transactional'
                    }
                }
            )
            message_id = response.get('MessageId', 'unknown')
            logger.info(f"SMS sent via AWS SNS to {recipient}: {message_id}")
            return message_id

        except Exception as e:
            aws_exception = e
            logger.exception("AWS SNS SMS failed")

    # If neither service is available or both failed, surface the real errors for debugging
    if not twilio_available and not aws_available:
        logger.error(
            "No SMS service configured. Twilio available=%s, AWS available=%s. Message not sent to %s",
            twilio_available,
            aws_available,
            recipient,
        )
        raise Exception("No SMS service configured or available")

    # If services were configured but both attempts failed, raise combined error with short messages
    errs = []
    if twilio_exception:
        errs.append(f"Twilio error: {type(twilio_exception).__name__}: {str(twilio_exception)}")
    if aws_exception:
        errs.append(f"AWS error: {type(aws_exception).__name__}: {str(aws_exception)}")

    combined = "; ".join(errs) if errs else "Unknown error sending SMS"
    logger.error("SMS sending failed for %s: %s", recipient, combined)
    raise Exception(f"SMS sending failed: {combined}")

