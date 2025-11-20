from rest_framework import serializers
from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from .models import Profile, DoctorPatient, Record, AudioRecording, ChatMessage, Prescription, Appointment, TakenDose
import logging

logger = logging.getLogger(__name__)


class FileUploadMixin:
    """
    Mixin to handle file uploads for URLField models.
    Intercepts file objects before URLField validation and uploads them to GCS.
    """
    
    def get_file_field_mappings(self):
        """
        Override this method to specify which fields should be treated as file uploads.
        Returns dict: {field_name: gcs_folder}
        Example: {'file': 'records', 'photo': 'profiles'}
        """
        raise NotImplementedError("Subclass must implement get_file_field_mappings()")
    
    def to_internal_value(self, data):
        """Extract file objects before validation to prevent URLField validation errors."""
        if not isinstance(data, dict):
            return super().to_internal_value(data)
        
        file_mappings = self.get_file_field_mappings()
        uploaded_files = {}
        modified_data = data.copy()
        
        for field_name in file_mappings.keys():
            file_obj = data.get(field_name)
            if file_obj and hasattr(file_obj, 'read'):
                # Store file temporarily and remove from validation data
                uploaded_files[field_name] = file_obj
                modified_data = {k: v for k, v in modified_data.items() if k != field_name}
        
        # Store uploaded files for later use
        if uploaded_files:
            self._uploaded_files = uploaded_files
        
        return super().to_internal_value(modified_data)
    
    def _upload_files_to_gcs(self, validated_data):
        """Upload all stored files to GCS and add URLs to validated_data."""
        from .gcp_utils import save_uploaded_file
        
        if not hasattr(self, '_uploaded_files'):
            return
        
        file_mappings = self.get_file_field_mappings()
        
        for field_name, folder in file_mappings.items():
            file_obj = self._uploaded_files.get(field_name)
            if file_obj:
                try:
                    file_url = save_uploaded_file(file_obj, folder=folder)
                    validated_data[field_name] = file_url
                    logger.info(f"Uploaded {field_name} to GCS: {file_url}")
                except Exception as e:
                    logger.error(f"Failed to upload {field_name} to GCS: {str(e)}")
                    raise serializers.ValidationError({
                        field_name: f"File upload failed: {str(e)}"
                    })
    
    def validate_file_required(self, field_name):
        """Check if a file is present for a required file field during creation."""
        if self.instance is None:  # Only for creation
            has_file = hasattr(self, '_uploaded_files') and field_name in self._uploaded_files
            if not has_file:
                raise serializers.ValidationError({
                    field_name: 'This field is required.'
                })
        return True
    
    def create(self, validated_data):
        """Upload files before creating the instance."""
        self._upload_files_to_gcs(validated_data)
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Upload files before updating the instance."""
        self._upload_files_to_gcs(validated_data)
        return super().update(instance, validated_data)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    role = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ('user', 'name', 'role', 'photo_url', 'phone_number')

    def get_role(self, obj):
        groups = obj.user.groups.all()
        if groups.filter(name='Doctor').exists():
            return 'doctor'
        elif groups.filter(name='Admin').exists():
            return 'admin'
        else:
            return 'patient'

    def get_photo_url(self, obj):
        return obj.photo or None


class DoctorPatientSerializer(serializers.ModelSerializer):
    doctor = serializers.StringRelatedField()
    patient = UserSerializer()
    patient_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = DoctorPatient
        fields = ('id', 'doctor', 'patient', 'patient_name', 'phone', 'added_at')

    def get_patient_name(self, obj):
        if hasattr(obj.patient, 'profile'):
            return obj.patient.profile.name or obj.patient.username
        return obj.patient.username

    def get_phone(self, obj):
        if hasattr(obj.patient, 'profile'):
            return obj.patient.profile.phone_number
        return None


class RecordSerializer(FileUploadMixin, serializers.ModelSerializer):
    """Serializer for patient medical records with GCS file upload support."""
    
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Record
        fields = ('id', 'doctor', 'doctor_name', 'patient', 'type', 'title', 'file', 'uploaded_at', 'uploaded_by')
        read_only_fields = ('uploaded_at',)
        extra_kwargs = {
            'file': {'required': False}  # Allow file upload, will be set by mixin
        }
    
    def get_file_field_mappings(self):
        return {'file': 'records'}

    def get_doctor_name(self, obj):
        if hasattr(obj.doctor, 'profile'):
            return obj.doctor.profile.name or obj.doctor.get_full_name() or obj.doctor.username
        return obj.doctor.username

    def validate(self, attrs):
        """Validate that file is provided for new records."""
        self.validate_file_required('file')
        return super().validate(attrs)


class AudioRecordingSerializer(FileUploadMixin, serializers.ModelSerializer):
    """Serializer for audio recordings with GCS file upload support."""
    
    duration = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AudioRecording
        fields = ('id', 'doctor', 'doctor_name', 'patient', 'title', 'audio_file', 'transcription', 'language', 'recorded_at', 'uploaded_by', 'duration')
        read_only_fields = ('recorded_at',)
        extra_kwargs = {
            'audio_file': {'required': False},  # Allow file upload, will be set by mixin
            'transcription': {'required': False, 'allow_blank': True}  # Optional, backend will transcribe if not provided
        }
    
    def get_file_field_mappings(self):
        return {'audio_file': 'audio'}

    def get_duration(self, obj):
        # TODO: Implement audio duration calculation
        return None

    def get_doctor_name(self, obj):
        if hasattr(obj.doctor, 'profile'):
            return obj.doctor.profile.name or obj.doctor.get_full_name() or obj.doctor.username
        return obj.doctor.username

    def validate(self, attrs):
        """Validate that audio file is provided for new recordings."""
        self.validate_file_required('audio_file')
        return super().validate(attrs)

class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages between doctors and patients."""
    
    text = serializers.CharField(source='message')
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = ('id', 'doctor', 'doctor_name', 'patient', 'text', 'timestamp', 'sender')
        read_only_fields = ('timestamp',)

    def get_doctor_name(self, obj):
        if hasattr(obj.doctor, 'profile'):
            return obj.doctor.profile.name or obj.doctor.get_full_name() or obj.doctor.username
        return obj.doctor.username


class PrescriptionSerializer(serializers.ModelSerializer):
    """Serializer for medical prescriptions."""
    
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = ('id', 'doctor', 'doctor_name', 'patient', 'medicines', 'notes', 'duration_days', 'created_at')
        read_only_fields = ('created_at',)

    def get_doctor_name(self, obj):
        if hasattr(obj.doctor, 'profile'):
            return obj.doctor.profile.name or obj.doctor.get_full_name() or obj.doctor.username
        return obj.doctor.username


class TakenDoseSerializer(serializers.ModelSerializer):
    """Serializer for tracking medication doses taken by patients."""
    
    prescription_title = serializers.SerializerMethodField()
    
    class Meta:
        model = TakenDose
        fields = ('id', 'prescription', 'prescription_title', 'medicine_name', 'taken_at')

    def get_prescription_title(self, obj):
        doctor_name = obj.prescription.doctor.username
        if hasattr(obj.prescription.doctor, 'profile'):
            doctor_name = obj.prescription.doctor.profile.name or doctor_name
        return f"Prescription by {doctor_name}"


class DoctorBasicSerializer(serializers.ModelSerializer):
    """Basic doctor information serializer."""
    
    name = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'photo_url')

    def get_name(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.name or obj.get_full_name() or obj.username
        return obj.username

    def get_photo_url(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.photo or None
        return None

class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for doctor-patient appointments."""
    
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    patient_phone = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ('id', 'doctor', 'doctor_name', 'patient', 'patient_name', 'patient_phone', 
                  'requested_start_date', 'requested_end_date', 'status', 'booked_date', 
                  'booked_time', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')

    def get_doctor_name(self, obj):
        if hasattr(obj.doctor, 'profile'):
            return obj.doctor.profile.name or obj.doctor.get_full_name() or obj.doctor.username
        return obj.doctor.username

    def get_patient_name(self, obj):
        if hasattr(obj.patient, 'profile'):
            return obj.patient.profile.name or obj.patient.get_full_name() or obj.patient.username
        return obj.patient.username

    def get_patient_phone(self, obj):
        if hasattr(obj.patient, 'profile'):
            return obj.patient.profile.phone_number
        return None

class SignupSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(write_only=True, max_length=100)
    phone_number = serializers.CharField(write_only=True, required=False, max_length=15, allow_blank=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'name', 'phone_number')

    def validate_email(self, value):
        """Ensure email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def create(self, validated_data):
        """Create user and associated profile."""
        name = validated_data.pop('name')
        phone_number = validated_data.pop('phone_number', '')
        email = validated_data['email']
        
        # Use email as username
        validated_data['username'] = email
        
        # Create user
        user = User.objects.create_user(**validated_data)
        
        # Update profile
        user.profile.name = name
        user.profile.phone_number = phone_number
        user.profile.save()
        
        # Add to Patient group
        patient_group, _ = Group.objects.get_or_create(name='Patient')
        user.groups.add(patient_group)
        
        logger.info(f"New user registered: {user.email}")
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user authentication."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        """Authenticate user credentials."""
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Must include email and password.')
        
        # Try to find user by email first
        user_obj = User.objects.filter(email=email).first()
        
        if user_obj:
            # If user found by email, use their username for authentication
            user = authenticate(username=user_obj.username, password=password)
        else:
            # Fallback to using email as username (legacy behavior)
            user = authenticate(username=email, password=password)
        
        if not user:
            raise serializers.ValidationError('Unable to log in with provided credentials.')
        
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')
        
        data['user'] = user
        return data
