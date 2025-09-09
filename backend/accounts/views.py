from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User, Group
from .serializers import SignupSerializer, LoginSerializer, ProfileSerializer, DoctorPatientSerializer, RecordSerializer, AudioRecordingSerializer, ChatMessageSerializer, PrescriptionSerializer
from .models import DoctorPatient, Record, AudioRecording, ChatMessage, Prescription
from django.db.models import Q
import os

class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': ProfileSerializer(user.profile).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': ProfileSerializer(user.profile).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DoctorPatientsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        patients = DoctorPatient.objects.filter(doctor=request.user).select_related('patient')
        serializer = DoctorPatientSerializer(patients, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            patient = User.objects.get(email=email, groups__name='Patient')
        except User.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
        if DoctorPatient.objects.filter(doctor=request.user, patient=patient).exists():
            return Response({'error': 'Patient already added'}, status=status.HTTP_400_BAD_REQUEST)
        doctor_patient = DoctorPatient.objects.create(doctor=request.user, patient=patient)
        serializer = DoctorPatientSerializer(doctor_patient)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class PatientRecordsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist):
            return Response({'error': 'Patient not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        records = Record.objects.filter(doctor=request.user, patient=patient)
        serializer = RecordSerializer(records, many=True)
        return Response(serializer.data)

    def post(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist):
            return Response({'error': 'Patient not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data['doctor'] = request.user.id
        data['patient'] = patient.id
        serializer = RecordSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        record_id = request.data.get('record_id')
        if not record_id:
            return Response({'error': 'Record ID required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
            record = Record.objects.get(id=record_id, doctor=request.user, patient=patient)
            
            # Delete the file if it exists
            if record.file:
                file_path = record.file.path
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            record.delete()
            return Response({'message': 'Record deleted'}, status=status.HTTP_204_NO_CONTENT)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist, Record.DoesNotExist):
            return Response({'error': 'Record not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Error deleting record: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PatientAudioRecordingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist):
            return Response({'error': 'Patient not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        recordings = AudioRecording.objects.filter(doctor=request.user, patient=patient)
        serializer = AudioRecordingSerializer(recordings, many=True)
        return Response(serializer.data)

    def post(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist):
            return Response({'error': 'Patient not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data['doctor'] = request.user.id
        data['patient'] = patient.id
        serializer = AudioRecordingSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        recording_id = request.data.get('recording_id')
        if not recording_id:
            return Response({'error': 'Recording ID required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
            recording = AudioRecording.objects.get(id=recording_id, doctor=request.user, patient=patient)
            
            # Delete the audio file if it exists
            if recording.audio_file:
                file_path = recording.audio_file.path
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            recording.delete()
            return Response({'message': 'Recording deleted'}, status=status.HTTP_204_NO_CONTENT)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist, AudioRecording.DoesNotExist):
            return Response({'error': 'Recording not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Error deleting recording: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PatientChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist):
            return Response({'error': 'Patient not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        messages = ChatMessage.objects.filter(doctor=request.user, patient=patient).order_by('timestamp')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist):
            return Response({'error': 'Patient not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data['doctor'] = request.user.id
        data['patient'] = patient.id
        data['sender'] = 'doctor'
        serializer = ChatMessageSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PatientPrescriptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist):
            return Response({'error': 'Patient not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        prescriptions = Prescription.objects.filter(doctor=request.user, patient=patient)
        serializer = PrescriptionSerializer(prescriptions, many=True)
        return Response(serializer.data)

    def post(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist):
            return Response({'error': 'Patient not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data['doctor'] = request.user.id
        data['patient'] = patient.id
        serializer = PrescriptionSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        prescription_id = request.data.get('prescription_id')
        if not prescription_id:
            return Response({'error': 'Prescription ID required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
            prescription = Prescription.objects.get(id=prescription_id, doctor=request.user, patient=patient)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist, Prescription.DoesNotExist):
            return Response({'error': 'Prescription not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        prescription.delete()
        return Response({'message': 'Prescription deleted'}, status=status.HTTP_204_NO_CONTENT)
