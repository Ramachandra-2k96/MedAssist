import re
import boto3
from twilio.rest import Client
from django.conf import settings
import logging
import secrets
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from sib_api_v3_sdk.api.transactional_emails_api import TransactionalEmailsApi
from sib_api_v3_sdk.models.send_smtp_email import SendSmtpEmail

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

    else:
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


def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(str(secrets.randbelow(10)) for _ in range(6))


def send_password_reset_email(receiver_email: str, otp: str) -> bool:
    """
    Sends a password reset OTP email using Brevo API.
    
    Args:
        receiver_email (str): The recipient's email address.
        otp (str): The 6-digit OTP code.
    
    Returns:
        bool: True if email sent successfully, False otherwise.
    """
    try:
        api_key = settings.BREVO_API_KEY
        sender_email = settings.BREVO_API_EMAIL
        
        if not api_key or not sender_email:
            logger.error("Brevo API credentials not configured")
            return False
        
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You have requested to reset your password. Please use the verification code below:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #4CAF50; letter-spacing: 5px; margin: 0;">{otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">This is an automated message from MedAssist. Please do not reply.</p>
        </div>
        """
        
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = api_key
        api_instance = TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        email = SendSmtpEmail(
            sender={"email": sender_email, "name": "MedAssist"},
            to=[{"email": receiver_email}],
            subject="Password Reset - Verification Code",
            html_content=html
        )
        
        response = api_instance.send_transac_email(email)
        logger.info(f"Password reset email sent successfully to {receiver_email}")
        return True
        
    except ApiException as e:
        logger.error(f"Brevo API error sending email to {receiver_email}: {e}")
        return False
    except Exception as e:
        logger.error(f"Error sending password reset email to {receiver_email}: {e}")
        return False
