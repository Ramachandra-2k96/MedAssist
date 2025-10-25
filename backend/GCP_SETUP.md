# GCP Cloud Storage Integration - Setup Guide

## Overview
This project uses Google Cloud Storage (GCS) for file uploads. All file uploads (profiles, records, audio recordings) are stored in GCS with publicly accessible URLs stored in the database.

## Prerequisites

### 1. Google Cloud Service Account JSON File

You **MUST** have a GCP service account JSON file to use this application.

**Steps to get the JSON file:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Give it a name (e.g., "medassist-storage")
6. Grant it the role: **Storage Admin**
7. Click **Done**
8. Click on the created service account
9. Go to **Keys** tab
10. Click **Add Key** > **Create New Key**
11. Choose **JSON** format
12. Download the JSON file

### 2. Place the JSON File

**IMPORTANT:** Place your downloaded GCP service account JSON file in the `backend/` folder.

For example:
```
backend/
  ├── gcp-service-account.json  <-- Your JSON file here
  ├── manage.py
  ├── .env
  └── ...
```

## Configuration

### Environment Variables

Update your `backend/.env` file:

```env
# GCP / Google Cloud Storage configuration
GCP_SERVICE_ACCOUNT_FILE=/absolute/path/to/medassist/backend/gcp-service-account.json
GCP_BUCKET_NAME=medassist-bucket
```

**Important:**
- `GCP_SERVICE_ACCOUNT_FILE`: Must be the **absolute path** to your JSON file
- `GCP_BUCKET_NAME`: Name of the GCS bucket (will be created automatically if it doesn't exist)

### Example Configuration

```env
GCP_SERVICE_ACCOUNT_FILE=/home/ramachandra/Documents/medassist/backend/cyoproject-476108-ff9e7996bc22.json
GCP_BUCKET_NAME=medassist-bucket
```

## How It Works

### Automatic Bucket Setup

When the Django app starts, the `accounts/gcp_utils.py` module will:

1. **Authenticate** using your service account JSON file
2. **Create bucket** if it doesn't exist with:
   - Uniform bucket-level access (UBLA) enabled
   - US multi-region location
3. **Set IAM Policy** to make all objects publicly readable:
   ```python
   policy.bindings.append({"role": "roles/storage.objectViewer", "members": {"allUsers"}})
   ```

### File Upload Flow

When a file is uploaded via API:

1. **Serializer receives file** (via `FileUploadMixin.to_internal_value()`)
2. **File is temporarily stored** in memory
3. **`upload_file()` is called** during `create()` or `update()`
4. **File is uploaded to GCS** with unique filename
5. **Public URL is returned** and stored in database
6. **Temporary file is deleted**

### File Structure in GCS

```
medassist-bucket/
  ├── profiles/
  │   └── a1b2c3d4e5f6.jpg
  ├── records/
  │   └── f6e5d4c3b2a1.pdf
  └── audio/
      └── 1a2b3c4d5e6f.mp3
```

### Public URL Format

All uploaded files get a public URL:
```
https://storage.googleapis.com/medassist-bucket/records/a1b2c3d4e5f6.pdf
```

## Models Using GCS

### Profile Photo
```python
class Profile(models.Model):
    photo = models.URLField(max_length=500, blank=True, null=True)
```

### Medical Records
```python
class Record(models.Model):
    file = models.URLField(max_length=500, blank=True, null=True)
```

### Audio Recordings
```python
class AudioRecording(models.Model):
    audio_file = models.URLField(max_length=500)  # Required
```

## API Usage

### Upload a Medical Record

```bash
POST /api/records/
Content-Type: multipart/form-data

{
  "patient": 1,
  "file": <file>,
  "description": "Lab results"
}
```

**Response:**
```json
{
  "id": 1,
  "patient": 1,
  "file": "https://storage.googleapis.com/medassist-bucket/records/a1b2c3d4.pdf",
  "description": "Lab results",
  "uploaded_at": "2024-01-15T10:30:00Z"
}
```

### Upload Audio Recording

```bash
POST /api/audio-recordings/
Content-Type: multipart/form-data

{
  "patient": 1,
  "doctor": 2,
  "audio_file": <file>
}
```

**Response:**
```json
{
  "id": 1,
  "patient": 1,
  "doctor": 2,
  "audio_file": "https://storage.googleapis.com/medassist-bucket/audio/e5f6a7b8.mp3",
  "recorded_at": "2024-01-15T10:30:00Z"
}
```

## Troubleshooting

### "Could not automatically determine credentials"

**Problem:** Django can't find your service account JSON file.

**Solution:** 
- Check that `GCP_SERVICE_ACCOUNT_FILE` in `.env` points to the correct absolute path
- Verify the JSON file exists at that location
- Restart Django server after updating `.env`

### "Permission denied" or "Access denied"

**Problem:** Service account lacks necessary permissions.

**Solution:**
- Go to GCP Console > IAM & Admin > IAM
- Find your service account
- Add role: **Storage Admin**

### Bucket not being created

**Problem:** Bucket name conflicts or region issues.

**Solution:**
- Bucket names must be globally unique
- Change `GCP_BUCKET_NAME` to something unique like `medassist-bucket-yourname`
- Restart Django to trigger bucket creation

### Files uploading but URLs not accessible

**Problem:** IAM policy not set correctly.

**Solution:**
- The `init_bucket()` function should automatically set public access
- If not, manually set IAM policy in GCP Console:
  1. Go to Cloud Storage > Buckets
  2. Click your bucket
  3. Go to Permissions tab
  4. Add principal: `allUsers`
  5. Role: `Storage Object Viewer`

## Security Notes

⚠️ **IMPORTANT:**
- Never commit your service account JSON file to git
- Add `*.json` to `.gitignore` (except `package.json`)
- The JSON file contains sensitive credentials
- All uploaded files are **publicly accessible** via their URLs
- Consider implementing authentication/authorization for sensitive files

## Migration from Local Storage

If you're migrating from local file storage:

1. **Database migration created:** `0012_convert_files_to_urls.py`
2. **Old files:** Previously uploaded local files will need manual migration
3. **File fields changed:** All `FileField`/`ImageField` → `URLField`

### Manual Migration Steps (if needed)

```python
# Run this in Django shell: python manage.py shell
from accounts.models import Record
from accounts.gcp_utils import upload_file

for record in Record.objects.all():
    if record.file and not record.file.startswith('http'):
        # Upload old local file to GCS
        with open(record.file.path, 'rb') as f:
            new_url = upload_file(f, 'records')
            record.file = new_url
            record.save()
```
