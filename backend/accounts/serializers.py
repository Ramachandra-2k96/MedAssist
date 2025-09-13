from rest_framework import serializers
from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from .models import Profile, DoctorPatient, Record, AudioRecording, ChatMessage, Prescription, Appointment, TakenDose

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
        if obj.photo:
            return obj.photo.url
        return None

class DoctorPatientSerializer(serializers.ModelSerializer):
    doctor = serializers.StringRelatedField()
    patient = UserSerializer()
    patient_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = DoctorPatient
        fields = ('id', 'doctor', 'patient', 'patient_name', 'phone', 'added_at')

    def get_patient_name(self, obj):
        try:
            return obj.patient.profile.name or obj.patient.username
        except Exception:
            return obj.patient.username

    def get_phone(self, obj):
        return obj.patient.profile.phone_number

class RecordSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    class Meta:
        model = Record
        fields = ('id', 'doctor', 'doctor_name', 'patient', 'type', 'title', 'file', 'uploaded_at', 'uploaded_by')

    def get_doctor_name(self, obj):
        try:
            return obj.doctor.profile.name or obj.doctor.get_full_name() or obj.doctor.username
        except Exception:
            return None

    def validate(self, attrs):
        # Require a file to be uploaded when creating a new Record
        # Allow existing instances to remain even if file is missing
        if self.instance is None:
            # When using multipart form, DRF places files in initial_data as well
            incoming = getattr(self, 'initial_data', {}) or {}
            has_file = bool(incoming.get('file') or attrs.get('file'))
            if not has_file:
                raise serializers.ValidationError({'file': 'This field is required.'})
        return super().validate(attrs)

class AudioRecordingSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    class Meta:
        model = AudioRecording
        fields = ('id', 'doctor', 'doctor_name', 'patient', 'title', 'audio_file', 'transcription', 'language', 'recorded_at', 'uploaded_by', 'duration')

    def get_duration(self, obj):
        return None  # placeholder

    def get_doctor_name(self, obj):
        try:
            return obj.doctor.profile.name or obj.doctor.get_full_name() or obj.doctor.username
        except Exception:
            return None

class ChatMessageSerializer(serializers.ModelSerializer):
    text = serializers.CharField(source='message')
    doctor_name = serializers.SerializerMethodField()
    class Meta:
        model = ChatMessage
        fields = ('id', 'doctor', 'doctor_name', 'patient', 'text', 'timestamp', 'sender')

    def get_doctor_name(self, obj):
        try:
            return obj.doctor.profile.name or obj.doctor.get_full_name() or obj.doctor.username
        except Exception:
            return None

class PrescriptionSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    class Meta:
        model = Prescription
        fields = ('id', 'doctor', 'doctor_name', 'patient', 'medicines', 'notes', 'duration_days', 'created_at')

    def get_doctor_name(self, obj):
        try:
            return obj.doctor.profile.name or obj.doctor.get_full_name() or obj.doctor.username
        except Exception:
            return None

class TakenDoseSerializer(serializers.ModelSerializer):
    prescription_title = serializers.SerializerMethodField()
    class Meta:
        model = TakenDose
        fields = ('id', 'prescription', 'prescription_title', 'medicine_name', 'taken_at')

    def get_prescription_title(self, obj):
        return f"Prescription by {obj.prescription.doctor.profile.name or obj.prescription.doctor.username}"

class DoctorBasicSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'photo_url')

    def get_name(self, obj):
        try:
            return obj.profile.name or obj.get_full_name() or obj.username
        except Exception:
            return obj.username

    def get_photo_url(self, obj):
        try:
            if obj.profile.photo:
                return obj.profile.photo.url
        except Exception:
            return None
        return None

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    patient_phone = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ('id', 'doctor', 'doctor_name', 'patient', 'patient_name', 'patient_phone', 'requested_start_date', 'requested_end_date', 'status', 'booked_date', 'booked_time', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')

    def get_doctor_name(self, obj):
        try:
            return obj.doctor.profile.name or obj.doctor.get_full_name() or obj.doctor.username
        except Exception:
            return obj.doctor.username

    def get_patient_name(self, obj):
        try:
            return obj.patient.profile.name or obj.patient.get_full_name() or obj.patient.username
        except Exception:
            return obj.patient.username

    def get_patient_phone(self, obj):
        try:
            return obj.patient.profile.phone_number
        except Exception:
            return None

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('email', 'password', 'name', 'phone_number')

    def create(self, validated_data):
        name = validated_data.pop('name')
        phone_number = validated_data.pop('phone_number', '')
        email = validated_data['email']
        validated_data['username'] = email  # set username to email
        user = User.objects.create_user(**validated_data)
        user.profile.name = name
        user.profile.phone_number = phone_number
        user.profile.save()
        patient_group, created = Group.objects.get_or_create(name='Patient')
        user.groups.add(patient_group)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        if email and password:
            user = authenticate(username=email, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('User account is disabled.')
            else:
                raise serializers.ValidationError('Unable to log in with provided credentials.')
        else:
            raise serializers.ValidationError('Must include email and password.')
        return data
