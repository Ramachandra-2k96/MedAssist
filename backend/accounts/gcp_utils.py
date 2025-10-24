"""
Google Cloud Storage utilities for file uploads.
Uses service account JSON file for authentication.
"""
from google.cloud import storage
from google.api_core.exceptions import NotFound
from django.conf import settings
import os
from urllib.parse import quote
import uuid
import logging

logger = logging.getLogger(__name__)


# Global bucket instance
_bucket = None


def init_bucket():
    """
    Initialize the GCS bucket at server startup.
    Creates bucket if it doesn't exist, otherwise just connects to it.
    Returns the bucket instance.
    """
    global _bucket
    
    if not settings.GCP_SERVICE_ACCOUNT_FILE or not settings.GCP_BUCKET_NAME:
        raise ValueError("GCP_SERVICE_ACCOUNT_FILE and GCP_BUCKET_NAME must be set in settings")
    
    client = storage.Client.from_service_account_json(settings.GCP_SERVICE_ACCOUNT_FILE)
    
    # Check if bucket exists
    try:
        _bucket = client.get_bucket(settings.GCP_BUCKET_NAME)
        logger.info(f"Connected to existing GCS bucket: {settings.GCP_BUCKET_NAME}")
    except NotFound:
        _bucket = client.create_bucket(settings.GCP_BUCKET_NAME)
        # Enable Uniform Bucket-Level Access
        _bucket.iam_configuration.uniform_bucket_level_access_enabled = True
        _bucket.patch()
        logger.info(f"Created new GCS bucket: {settings.GCP_BUCKET_NAME}")
    
    # Grant public read access via IAM (works with UBLA)
    policy = _bucket.get_iam_policy(requested_policy_version=3)
    # Add public read role only if not already present
    if not any(b for b in policy.bindings if b["role"] == "roles/storage.objectViewer" and "allUsers" in b["members"]):
        policy.bindings.append({
            "role": "roles/storage.objectViewer",
            "members": {"allUsers"}
        })
        _bucket.set_iam_policy(policy)
        logger.info(f"Set public access policy for bucket: {settings.GCP_BUCKET_NAME}")
    
    return _bucket


def get_bucket():
    """Get the initialized bucket instance."""
    global _bucket
    if _bucket is None:
        _bucket = init_bucket()
    return _bucket


def generate_unique_filename(original_filename, prefix=''):
    """
    Generate a unique filename to avoid collisions.
    
    Args:
        original_filename: The original filename with extension
        prefix: Optional prefix for the filename (e.g., 'profiles/', 'audio/')
    
    Returns:
        Unique filename with path
    """
    # Extract extension
    name, ext = os.path.splitext(original_filename)
    # Generate unique name
    unique_name = f"{uuid.uuid4().hex}{ext}"
    # Combine with prefix
    return os.path.join(prefix, unique_name) if prefix else unique_name


def upload_file(file_obj, destination_path=None, content_type=None, make_public=True):
    """
    Upload a file to GCS and return the public URL.
    
    Args:
        file_obj: File object (e.g., from request.FILES or InMemoryUploadedFile)
        destination_path: Optional custom path in bucket. If None, generates unique name
        content_type: Optional content type. If None, inferred from file
        make_public: Whether to make the file publicly accessible (default True)
    
    Returns:
        Public URL of the uploaded file
    """
    bucket = get_bucket()
    
    # Generate destination path if not provided
    if destination_path is None:
        original_filename = getattr(file_obj, 'name', 'file')
        destination_path = generate_unique_filename(original_filename)
    
    # Create blob
    blob = bucket.blob(destination_path)
    
    # Set content type
    if content_type:
        blob.content_type = content_type
    elif hasattr(file_obj, 'content_type'):
        blob.content_type = file_obj.content_type
    
    # Upload file
    file_obj.seek(0)  # Ensure we're at the start of the file
    blob.upload_from_file(file_obj, rewind=True)
    
    # No need to call blob.make_public() - IAM policy handles public access
    
    # Return the public URL
    return get_public_url(destination_path)


def get_public_url(blob_name):
    """
    Get the public URL for a blob.
    
    Args:
        blob_name: Name/path of the blob in the bucket
    
    Returns:
        Public URL string
    """
    # URL-encode the blob name to handle special characters
    encoded_blob_name = quote(blob_name, safe='/')
    
    # Construct public URL (no blob.make_public needed with IAM policy)
    return f"https://storage.googleapis.com/{settings.GCP_BUCKET_NAME}/{encoded_blob_name}"


def get_public_url(blob_name):
    """
    Get the public URL for a blob in production GCS.
    
    Args:
        blob_name: Name/path of the blob in the bucket
    
    Returns:
        Public URL string in format: https://storage.googleapis.com/bucket/path
    """
    # URL-encode the blob name to handle special characters
    encoded_blob_name = quote(blob_name, safe='/')
    
    # Production GCS public URL
    return f"https://storage.googleapis.com/{settings.GCP_BUCKET_NAME}/{encoded_blob_name}"


def delete_file(blob_name):
    """
    Delete a file from GCS.
    
    Args:
        blob_name: Name/path of the blob to delete
    
    Returns:
        True if deleted, False if not found
    """
    try:
        bucket = get_bucket()
        blob = bucket.blob(blob_name)
        blob.delete()
        logger.info(f"Deleted file from GCS: {blob_name}")
        return True
    except NotFound:
        logger.warning(f"File not found in GCS for deletion: {blob_name}")
        return False
    except Exception as e:
        logger.error(f"Error deleting file {blob_name} from GCS: {str(e)}")
        return False


def extract_blob_name_from_url(url):
    """
    Extract blob name/path from a GCS URL.
    
    Args:
        url: Full GCS URL
    
    Returns:
        Blob name/path or None if URL format is unrecognized
    """
    if not url:
        return None
    
    # Handle production GCS URL format
    if 'storage.googleapis.com' in url:
        # Format: https://storage.googleapis.com/bucket-name/path/to/file
        try:
            parts = url.split(f"{settings.GCP_BUCKET_NAME}/")
            if len(parts) == 2:
                from urllib.parse import unquote
                return unquote(parts[1])
        except Exception:
            pass
    
    return None


def save_uploaded_file(file_obj, folder='uploads'):
    """
    Convenience function to save an uploaded file with automatic path generation.
    
    Args:
        file_obj: File object from request.FILES
        folder: Folder prefix (e.g., 'profiles', 'audio', 'records')
    
    Returns:
        Public URL of the uploaded file
    """
    if not file_obj:
        return None
    
    original_filename = file_obj.name
    destination_path = generate_unique_filename(original_filename, prefix=folder)
    return upload_file(file_obj, destination_path=destination_path)
