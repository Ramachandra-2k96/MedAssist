# MedAssist

## Overview

MedAssist is a comprehensive mobile and web-based health education and follow-up system designed to improve treatment adherence and patient engagement, particularly in semi-urban areas. It addresses challenges like low literacy, memory lapses, and language barriers by automating personalized health information delivery via SMS and app notifications.

Key features include:
- Medication and appointment reminders (with special alerts for pregnant women and children)
- Speech-to-text engine for transcribing doctors' spoken instructions into readable SMS and printable formats
- Emoji-based, color-coded medicine schedule showing tablet size, shape, and color
- Secure storage of health documents (lab reports, X-rays, prescriptions) in Google Cloud Storage
- Doctor monitoring of patient status, query responses, and secure sharing of medical history
- NLP integration for enhanced user interaction and automated health query responses
- Support for both digital (web app) and paper-based options for maximum inclusivity
- Comprehensive Terms & Conditions and Privacy Policy pages
- Admin panel for managing doctors with email-based authentication

The system combines automation, visual aids, multilingual support, and intuitive design to improve compliance, reduce confusion, ease healthcare providers' workload, and enhance overall healthcare delivery.

## Technologies Used

### Backend
- **Django 5.2.6**: Web framework for building the API
- **Django REST Framework**: For building RESTful APIs
- **Django Simple JWT**: For JSON Web Token authentication
- **Django CORS Headers**: For handling Cross-Origin Resource Sharing
- **Django Crontab**: For scheduling periodic tasks (SMS reminders)
- **Twilio**: For sending SMS notifications
- **AWS SNS**: For additional notification services
- **SQLite**: Database (default, can be configured for others)
- **Python 3.12**: Programming language

### Frontend
- **Next.js 15.2.4**: React framework for the web application
- **React 19**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Component library for accessible UI components
- **Framer Motion**: Animation library
- **React Hook Form**: For form handling
- **Zod**: Schema validation
- **Lucide React**: Icon library

## Folder Structure

```
medassist/
├── req.md                           # Project requirements and documentation
├── backend/                         # Django backend application
│   ├── accounts/                    # Main app for user accounts and features
│   │   ├── models.py                # Database models (Profile, Prescription, etc.)
│   │   ├── views.py                 # API views
│   │   ├── urls.py                  # URL patterns for API endpoints
│   │   ├── cron.py                  # Cron job for SMS reminders
│   │   ├── serializers.py           # DRF serializers
│   │   ├── utils.py                 # Utility functions (SMS sending)
│   │   ├── management/commands/     # Custom Django management commands
│   │   │   └── seed_demo_data.py    # Command to seed demo data
│   │   └── migrations/              # Database migrations
│   ├── backend/                     # Django project settings
│   │   ├── settings.py              # Main settings file
│   │   ├── urls.py                  # Root URL configuration
│   │   └── wsgi.py                  # WSGI configuration
│   ├── media/                       # User-uploaded media files
│   │   ├── audio/                   # Audio recordings
│   │   └── records/                 # Medical records
│   ├── logs/                        # Application logs
│   │   └── cron.log                 # Cron job logs
│   ├── manage.py                    # Django management script
│   ├── db.sqlite3                   # SQLite database file
│   ├── agno.db                      # Additional database (possibly for AI features)
│   └── requirments.txt              # Python dependencies
├── frontend/                        # Next.js frontend application
│   ├── app/                         # Next.js app directory
│   │   ├── dashboard/               # Patient dashboard
│   │   ├── doctor-dashboard/        # Doctor dashboard
│   │   ├── doctor-login/            # Doctor login page
│   │   ├── login/                   # General login page
│   │   ├── signup/                  # User registration page
│   │   ├── page.tsx                 # Home page
│   │   └── layout.tsx               # Root layout
│   ├── components/                  # Reusable React components
│   │   ├── ui/                      # UI components (buttons, forms, etc.)
│   │   ├── auth/                    # Authentication components
│   │   ├── dashboard/               # Dashboard components
│   │   └── home/                    # Home page components
│   ├── hooks/                       # Custom React hooks
│   ├── lib/                         # Utility libraries and configurations
│   ├── public/                      # Static assets
│   ├── styles/                      # Additional styles
│   ├── .env                         # Environment variables
│   ├── package.json                 # Node.js dependencies and scripts
│   ├── next.config.mjs              # Next.js configuration
│   └── tsconfig.json                # TypeScript configuration
```

## Installation and Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- pnpm (recommended) or npm

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirments.txt
   ```

4. Create a `.env` file in the backend directory with the required environment variables (see Environment Variables section below).

5. Run database migrations:
   ```bash
   python manage.py migrate
   ```
6. Create an Admin Account.
```bash
python manage.py createsuperuser
```
7. Now go to [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/) and use your admin credentials to login.

### Adding Doctors via Admin Panel

After logging into the Django admin panel:

1. **Navigate to Doctors section**: Click on "Doctors" in the admin sidebar
2. **Add a new doctor**: Click the "Add Doctor" button (top right)
3. **Fill required fields**:
   - **Username**: Choose a unique username for the doctor
   - **Email**: Doctor's email address (required - used for login)
   - **First Name**: Doctor's first name
   - **Last Name**: Doctor's last name
   - **Password**: Set a temporary password (doctor can change later)
4. **Save the doctor**: Click "Save" to create the doctor account

**Important Notes**:
- Email must be unique across all users
- Doctors can login using their email address
- Use strong passwords for doctor accounts

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create/update the `.env` file 

## Running the Application

### Backend

1. Activate the virtual environment (if not already activated):
   ```bash
   source venv/bin/activate
   ```

2. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://127.0.0.1:8000`.

### Frontend

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`.

## Database Setup and Seeding

### Running Migrations
After setting up the backend, run the migrations to create the database schema:
```bash
python manage.py migrate
```

### Creating the First User
To create a superuser (admin) if not alredy done:
```bash
python manage.py createsuperuser
```
Follow the prompts to set up the username, email, and password.

### Seeding Demo Data
The project includes a management command to seed the database with demo data (3 doctors and 10 patients):
```bash
python manage.py seed_demo_data
```

This will create:
- 3 doctors with emails `doctor1@example.com` to `doctor3@example.com`
- 10 patients with emails `patient1@example.com` to `patient10@example.com`
- All patients linked to all doctors

Default password for all created users: `Password123!`

## Cron Jobs for SMS

The application uses Django Crontab to schedule periodic tasks for sending SMS medication reminders.

### Setting Up Cron Jobs

1. Add the cron jobs to your system's crontab:
   ```bash
   python manage.py crontab add
   ```

2. The following cron job is configured in `settings.py`:
   - `send_medication_reminders`: Runs every 20 minutes to check for missed medication doses and send SMS reminders

### Viewing/Removing Cron Jobs
- To show current cron jobs: `python manage.py crontab show`
- To remove cron jobs: `python manage.py crontab remove`

### SMS Reminder Logic
- Checks all active prescriptions
- For each medicine in a prescription, calculates scheduled times based on frequency
- Sends SMS reminders if a dose was missed (within a 10-minute grace period)
- Tracks sent reminders to avoid duplicate notifications
- Supports various frequencies: once-daily, twice-daily, three-times-daily, four-times-daily, every-4/6/8/12-hours, weekly, monthly, etc.

## Available Pages

### Public Pages
- **Home** (`/`): Landing page with features and testimonials
- **Login** (`/login`): User login page
- **Signup** (`/signup`): User registration page
- **Doctor Login** (`/doctor-login`): Separate login for doctors
- **Terms & Conditions** (`/terms`): Comprehensive terms of service
- **Privacy Policy** (`/privacy`): Detailed privacy policy and data handling

### Protected Pages (require authentication)
- **Dashboard** (`/dashboard`): Patient dashboard with overview of health data
- **Doctor Dashboard** (`/doctor-dashboard`): Doctor dashboard for managing patients

## API Endpoints

All API endpoints are prefixed with `/api/` and require authentication (except signup and login).

### Authentication Endpoints
- `POST /api/signup/` - User registration
- `POST /api/login/` - User login
- `POST /api/logout/` - User logout

### Doctor Endpoints
- `GET /api/doctor/patients/` - List doctor's patients
- `GET /api/doctor/patients/{patient_id}/records/` - Get patient records
- `POST /api/doctor/patients/{patient_id}/records/` - Create patient record
- `GET /api/doctor/patients/{patient_id}/audio/` - Get patient audio recordings
- `POST /api/doctor/patients/{patient_id}/audio/` - Upload audio recording
- `GET /api/doctor/patients/{patient_id}/chat/` - Get chat messages with patient
- `POST /api/doctor/patients/{patient_id}/chat/` - Send message to patient
- `GET /api/doctor/patients/{patient_id}/prescriptions/` - Get patient prescriptions
- `POST /api/doctor/patients/{patient_id}/prescriptions/` - Create prescription
- `GET /api/doctor/profile/` - Get doctor profile
- `PUT /api/doctor/profile/` - Update doctor profile
- `GET /api/doctor/appointments/` - Get doctor's appointments

### Patient Endpoints
- `GET /api/patient/dashboard/` - Get patient dashboard data
- `GET /api/patient/records/` - Get patient's records
- `POST /api/patient/records/` - Upload patient record
- `GET /api/patient/audio/` - Get patient's audio recordings
- `POST /api/patient/audio/` - Upload audio recording
- `GET /api/patient/chat/` - Get chat messages
- `POST /api/patient/chat/` - Send message
- `GET /api/patient/prescriptions/` - Get patient's prescriptions
- `GET /api/patient/doctors/` - Get patient's doctors
- `GET /api/patient/appointments/` - Get patient's appointments
- `GET /api/patient/medication-logs/` - Get medication logs
- `POST /api/patient/medication-logs/` - Log taken medication
- `GET /api/patient/ai-chat/` - AI chat for health queries

### Utility Endpoints
- `POST /api/test-sms/` - Test SMS sending functionality

## SMS Features

#### SMS Service Configuration
The application supports multiple SMS providers with automatic fallback:

- **Primary**: Twilio (if credentials provided)
- **Secondary**: AWS SNS (if Twilio unavailable or credentials not provided)
- **Fallback**: If both services are configured, Twilio takes priority

#### Configuration
Set the appropriate environment variables in your `.env` file:

**For Twilio (Preferred)**:
```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890
```

**For AWS SNS (Fallback)**:
```env
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
```

#### Medication Reminders
- Automated SMS reminders for missed medication doses
- Supports multiple frequencies: daily, multiple times per day, hourly intervals
- Personalized messages with medicine name and scheduled time
- Tracks sent reminders to prevent duplicates
- Configurable grace period (currently 10 minutes)

#### SMS Sending
- Phone numbers are automatically normalized to international format (+91 for India)
- Messages include instructions to log in and mark doses as taken
- Comprehensive logging for debugging and monitoring

#### Testing SMS
- Test endpoint available at `/api/test-sms/` for development
- Allows verification of SMS configuration

## Environment Variables

### Backend (.env file in backend/ directory)

Create a `.env` file in the `backend/` directory with the following variables:

#### Required Variables
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+1234567890

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1

# Cerebras API (for AI chat features)
CEREBRUS_API_KEY=your-cerebras-api-key

# GCP Cloud Storage (Required for file uploads)
GCP_SERVICE_ACCOUNT_FILE=/absolute/path/to/backend/your-service-account.json
GCP_BUCKET_NAME=your-unique-bucket-name

Brevo_API_Key=xkeysib-20a05ffHFWjy94Tln82THsX
Brevo_API_Email=ramachandraudupa2004@gmail.com
```

#### Optional Variables
```env
# Database URL (for PostgreSQL or other databases)
DATABASE_URL=postgresql://user:password@localhost:5432/medassist

# Debug mode (set to False in production)
DEBUG=True

# Allowed hosts (add your domain in production)
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (.env file in frontend/ directory)

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

**Note**: Update `NEXT_PUBLIC_API_URL` if your backend runs on a different host/port.

## Additional Notes

### System Architecture
- The application uses JWT tokens for authentication with a 15-day expiration
- Media files (audio recordings, medical records) are stored securely in Google Cloud Storage
- Logs are written to `logs/cron.log` for cron job activities
- The system supports both fixed-time schedules and interval-based medication frequencies
- AI features are powered by Cerebras API for enhanced patient interactions

### Frontend Details
- The frontend uses modern React patterns with TypeScript for type safety
- Tailwind CSS provides responsive, utility-first styling
- Next.js App Router for optimal performance and SEO
- CORS is configured to allow requests from the Next.js development server

### Production Deployment Checklist
- Set `DEBUG=False` in Django settings
- Use a production-grade database (PostgreSQL recommended)
- Configure proper static file serving and CDN
- Set up HTTPS with SSL certificates
- Use environment-specific environment variables
- Configure proper logging and monitoring
- Set up automated backups
- Enable Django security middleware
- Configure rate limiting and DDoS protection

### Troubleshooting

#### Common Issues
- **File upload fails**: Check GCP service account file path and permissions
- **SMS not sending**: Verify Twilio credentials and phone number format
- **Email login not working**: Ensure doctor accounts have valid email addresses
- **Database errors**: Run `python manage.py migrate` after code changes

#### Getting Help
- Check Django logs: `tail -f logs/cron.log`
- Verify environment variables are loaded correctly
- Test API endpoints with tools like Postman
- Check browser console for frontend errors

For additional support, refer to the individual service documentation (Twilio, GCP, AWS).

