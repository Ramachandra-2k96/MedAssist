from rest_framework import serializers
from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from .models import Profile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

from rest_framework import serializers
from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from .models import Profile, DoctorPatient, Record, AudioRecording, ChatMessage, Prescription

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    role = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ('user', 'name', 'role', 'photo_url')

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

    class Meta:
        model = DoctorPatient
        fields = ('id', 'doctor', 'patient', 'added_at')

class RecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Record
        fields = ('id', 'doctor', 'patient', 'type', 'title', 'file', 'uploaded_at', 'uploaded_by')

class AudioRecordingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudioRecording
        fields = ('id', 'doctor', 'patient', 'title', 'audio_file', 'transcription', 'language', 'recorded_at', 'uploaded_by')

class ChatMessageSerializer(serializers.ModelSerializer):
    text = serializers.CharField(source='message')
    class Meta:
        model = ChatMessage
        fields = ('id', 'doctor', 'patient', 'text', 'timestamp', 'sender')

class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = ('id', 'doctor', 'patient', 'medicines', 'notes', 'created_at')

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'name')

    def create(self, validated_data):
        name = validated_data.pop('name')
        email = validated_data['email']
        validated_data['username'] = email  # set username to email
        user = User.objects.create_user(**validated_data)
        user.profile.name = name
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
