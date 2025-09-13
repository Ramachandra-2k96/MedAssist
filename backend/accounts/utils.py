# import re
# from twilio.rest import Client
# from django.conf import settings

# def send_sms(message_text: str, recipient: str) -> str:
#     """
#     Sends a normal SMS via Twilio.

#     Args:
#         message_text (str): The SMS text content.
#         recipient (str): The recipient's phone number. Accepts with or without country code.
#                          Defaults to Indian (+91) if no country code is provided.

#     Returns:
#         str: Twilio message SID (identifier) upon successful send.
#     """

#     account_sid = settings.TWILIO_ACCOUNT_SID
#     auth_token = settings.TWILIO_AUTH_TOKEN
#     from_number = settings.TWILIO_FROM_NUMBER

#     # Normalize recipient format to E.164
#     if not re.match(r'^\+\d{10,15}$', recipient):
#         recipient = "+91" + re.sub(r'\D', '', recipient)

#     client = Client(account_sid, auth_token)

#     msg = client.messages.create(
#         body=message_text,
#         from_=from_number,
#         to=recipient
#     )
#     return msg.sid
import re
import boto3
from django.conf import settings
import logging

logger = logging.getLogger('accounts.cron')

def send_sms(message_text: str, recipient: str) -> str:
    """
    Sends SMS via AWS SNS directly to a phone number.
    For now, this is a mock implementation that logs the SMS instead of sending it.
    """
    # Normalize phone number
    recipient = re.sub(r'\D', '', recipient)
    if not recipient.startswith("91"):
        recipient = "91" + recipient
    recipient = "+" + recipient

    # Mock implementation - just return a fake SID
    logger.info(f"MOCK SMS: To {recipient} - {message_text}")
    return "mock_sid_" + str(hash(message_text + recipient))[:8]

    # Uncomment below for actual AWS SNS sending
    # # Create SNS client
    # sns_client = boto3.client(
    #     "sns",
    #     aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    #     aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    #     region_name=settings.AWS_REGION
    # )

    # # Publish SMS
    # response = sns_client.publish(
    #     PhoneNumber=recipient,
    #     Message=message_text,
    #     MessageAttributes={
    #         'AWS.SNS.SMS.SMSType': {
    #             'DataType': 'String',
    #             'StringValue': 'Transactional'  # Required for India
    #         }
    #     }
    # )
    # return response.get('MessageId', 'unknown')

