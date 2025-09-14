from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User, Group
from .serializers import (
    SignupSerializer,
    LoginSerializer,
    ProfileSerializer,
    DoctorPatientSerializer,
    RecordSerializer,
    AudioRecordingSerializer,
    ChatMessageSerializer,
    PrescriptionSerializer,
    TakenDoseSerializer,
    DoctorBasicSerializer,
    AppointmentSerializer,
)
from .models import DoctorPatient, Record, AudioRecording, ChatMessage, Prescription, Profile, Appointment, TakenDose
from django.db.models import Q
import os
from datetime import datetime
from django.utils import timezone
from django.http import JsonResponse
from .utils import send_sms  # assuming you saved the function in utils.py
from agno.models.cerebras import CerebrasOpenAI
from agno.agent import Agent
from backend.settings import CEREBRUS_API_KEY


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
        # Show all records that belong to this patient, regardless of which doctor uploaded them
        records = Record.objects.filter(patient=patient).order_by('-uploaded_at')
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
            # Only allow delete if this record was uploaded by doctor
            if record.uploaded_by != 'doctor':
                return Response({'error': 'Only the uploader can delete this record'}, status=status.HTTP_403_FORBIDDEN)
            
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
        # Show all audio recordings that belong to this patient, regardless of which doctor uploaded them
        recordings = AudioRecording.objects.filter(patient=patient).order_by('-recorded_at')
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
            recording = serializer.save()
            # Send SMS with transcription to patient
            try:
                from .utils import send_sms
                patient_phone = patient.profile.phone_number
                if patient_phone and recording.transcription:
                    doctor_name = request.user.profile.name or request.user.username
                    message = f"Dr. {doctor_name}: {recording.transcription}"
                    send_sms(message, patient_phone)
            except Exception as e:
                # Log error but don't fail the request
                print(f"SMS failed: {e}")
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
            # Only allow delete if this recording was uploaded by doctor
            if recording.uploaded_by != 'doctor':
                return Response({'error': 'Only the uploader can delete this recording'}, status=status.HTTP_403_FORBIDDEN)
            
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


class DoctorProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProfileSerializer(request.user.profile)
        return Response(serializer.data)


class PatientDashboardDataView(APIView):
    """Aggregate fetch for a patient to view medicines (prescriptions), records, audio and chat per doctor.

    Query params:
      doctor_id (optional) -> restrict to a single doctor the patient is linked with.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        doctor_id = request.query_params.get('doctor_id')
        doctor_links = DoctorPatient.objects.filter(patient=request.user)
        if doctor_id:
            doctor_links = doctor_links.filter(doctor_id=doctor_id)
        doctor_ids = list(doctor_links.values_list('doctor_id', flat=True))
        # Prescriptions (medicines)
        prescriptions = Prescription.objects.filter(patient=request.user, doctor_id__in=doctor_ids).order_by('-created_at')
        prescription_data = PrescriptionSerializer(prescriptions, many=True).data
        # Records (both doctor and patient uploaded)
        records = Record.objects.filter(patient=request.user, doctor_id__in=doctor_ids).order_by('-uploaded_at')
        record_data = RecordSerializer(records, many=True).data
        # Audio recordings
        audio = AudioRecording.objects.filter(patient=request.user, doctor_id__in=doctor_ids).order_by('-recorded_at')
        audio_data = AudioRecordingSerializer(audio, many=True).data
        # Chat messages (optionally per doctor)
        chat_query = ChatMessage.objects.filter(patient=request.user, doctor_id__in=doctor_ids).order_by('timestamp')
        chat_data = ChatMessageSerializer(chat_query, many=True).data
        return Response({
            'prescriptions': prescription_data,
            'records': record_data,
            'audio_recordings': audio_data,
            'chat': chat_data,
            'doctor_ids': doctor_ids,
        })


class PatientRecordsManageView(APIView):
    """Patient can list own records and upload new record (uploaded_by='patient'). Cannot delete others' records."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        doctor_id = request.query_params.get('doctor_id')
        qs = Record.objects.filter(patient=request.user)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        data = RecordSerializer(qs.order_by('-uploaded_at'), many=True).data
        return Response(data)

    def post(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        doctor_id = request.data.get('doctor') or request.data.get('doctor_id')
        if not doctor_id:
            return Response({'error': 'doctor field required'}, status=status.HTTP_400_BAD_REQUEST)
        # ensure relation exists
        if not DoctorPatient.objects.filter(doctor_id=doctor_id, patient=request.user).exists():
            return Response({'error': 'Not linked to doctor'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        data['patient'] = request.user.id
        data['uploaded_by'] = 'patient'
        serializer = RecordSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        record_id = request.data.get('record_id')
        if not record_id:
            return Response({'error': 'record_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            record = Record.objects.get(id=record_id, patient=request.user)
            if record.uploaded_by != 'patient':
                return Response({'error': 'Cannot delete doctor uploaded record'}, status=status.HTTP_403_FORBIDDEN)
            # remove file
            if record.file:
                file_path = record.file.path
                if os.path.exists(file_path):
                    os.remove(file_path)
            record.delete()
            return Response({'message': 'Deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Record.DoesNotExist:
            return Response({'error': 'Record not found'}, status=status.HTTP_404_NOT_FOUND)


class PatientAudioManageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        doctor_id = request.query_params.get('doctor_id')
        qs = AudioRecording.objects.filter(patient=request.user)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        data = AudioRecordingSerializer(qs.order_by('-recorded_at'), many=True).data
        return Response(data)

    def post(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        doctor_id = request.data.get('doctor') or request.data.get('doctor_id')
        if not doctor_id:
            return Response({'error': 'doctor field required'}, status=status.HTTP_400_BAD_REQUEST)
        if not DoctorPatient.objects.filter(doctor_id=doctor_id, patient=request.user).exists():
            return Response({'error': 'Not linked to doctor'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        data['patient'] = request.user.id
        data['uploaded_by'] = 'patient'
        serializer = AudioRecordingSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        rec_id = request.data.get('recording_id')
        if not rec_id:
            return Response({'error': 'recording_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            rec = AudioRecording.objects.get(id=rec_id, patient=request.user)
            if rec.uploaded_by != 'patient':
                return Response({'error': 'Cannot delete doctor uploaded recording'}, status=status.HTTP_403_FORBIDDEN)
            if rec.audio_file:
                fp = rec.audio_file.path
                if os.path.exists(fp):
                    os.remove(fp)
            rec.delete()
            return Response({'message': 'Deleted'}, status=status.HTTP_204_NO_CONTENT)
        except AudioRecording.DoesNotExist:
            return Response({'error': 'Recording not found'}, status=status.HTTP_404_NOT_FOUND)


class PatientChatManageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        doctor_id = request.query_params.get('doctor_id')
        qs = ChatMessage.objects.filter(patient=request.user)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        data = ChatMessageSerializer(qs.order_by('timestamp'), many=True).data
        return Response(data)

    def post(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        # message can be for a specific doctor or broadcast to all linked doctors
        doctor_id = request.data.get('doctor') or request.data.get('doctor_id')
        text = request.data.get('text') or request.data.get('message')
        if not text:
            return Response({'error': 'text required'}, status=status.HTTP_400_BAD_REQUEST)
        created = []
        if doctor_id:
            if not DoctorPatient.objects.filter(doctor_id=doctor_id, patient=request.user).exists():
                return Response({'error': 'Not linked to doctor'}, status=status.HTTP_403_FORBIDDEN)
            serializer = ChatMessageSerializer(data={
                'doctor': doctor_id,
                'patient': request.user.id,
                'text': text,
                'sender': 'patient'
            })
            serializer.is_valid(raise_exception=True)
            serializer.save()
            created.append(serializer.data)
        else:
            # broadcast
            links = DoctorPatient.objects.filter(patient=request.user)
            for link in links:
                serializer = ChatMessageSerializer(data={
                    'doctor': link.doctor_id,
                    'patient': request.user.id,
                    'text': text,
                    'sender': 'patient'
                })
                if serializer.is_valid():
                    serializer.save()
                    created.append(serializer.data)
        return Response(created, status=status.HTTP_201_CREATED)


class PatientPrescriptionsViewPublic(APIView):
    """Patient can view prescriptions. No create/delete (doctor only)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        doctor_id = request.query_params.get('doctor_id')
        qs = Prescription.objects.filter(patient=request.user)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        data = PrescriptionSerializer(qs.order_by('-created_at'), many=True).data
        return Response(data)


class PatientDoctorsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        doctor_ids = DoctorPatient.objects.filter(patient=request.user).values_list('doctor_id', flat=True)
        doctors = User.objects.filter(id__in=doctor_ids)
        data = DoctorBasicSerializer(doctors, many=True).data
        return Response(data)

from agno.db.sqlite import SqliteDb
from agno.tools.memory import MemoryTools

db = SqliteDb(db_file="agno.db")
memory_tools = MemoryTools(
    db=db,
)

class PatientAIChatView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get or create consistent session_id for this user
        session_id = request.data.get('session_id') or f"patient_{request.user.id}_session"
        
        agent = Agent(
            model=CerebrasOpenAI(id="gpt-oss-120b", api_key=CEREBRUS_API_KEY),
            markdown=True,
            tools=[memory_tools],
            enable_user_memories=True,
            db=db,
            add_memories_to_context=True,
            add_history_to_context=True,  # This enables conversation memory
            num_history_runs=5,  # Include last 5 conversation turns
            session_id=session_id,  # Consistent session per user
        )
        
        message = request.data.get('message')
        if not message:
            return Response({'error': 'message required'}, status=status.HTTP_400_BAD_REQUEST)

        # Use consistent user_id
        run_response = agent.run(message, user_id=str(request.user.id))
        
        return Response({
            'reply': run_response.content, 
            'user_id': str(request.user.id),
            'session_id': session_id
        }, status=status.HTTP_200_OK)

class PatientAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        appointments = Appointment.objects.filter(patient=request.user).order_by('-created_at')
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        doctor_id = request.data.get('doctor')
        if not doctor_id:
            return Response({'error': 'Doctor ID required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            doctor = User.objects.get(id=doctor_id, groups__name='Doctor')
            DoctorPatient.objects.get(doctor=doctor, patient=request.user)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist):
            return Response({'error': 'Doctor not found or not associated'}, status=status.HTTP_404_NOT_FOUND)
        
        data = request.data.copy()
        data['patient'] = request.user.id
        serializer = AppointmentSerializer(data=data)
        if serializer.is_valid():
            appointment = serializer.save()
            # Send SMS notification to doctor
            try:
                from .utils import send_sms
                doctor_phone = doctor.profile.phone_number
                if doctor_phone:
                    message = f"New appointment request from {request.user.profile.name or request.user.username}"
                    send_sms(message, doctor_phone)
            except Exception as e:
                # Log error but don't fail the request
                print(f"SMS failed: {e}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DoctorAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        appointments = Appointment.objects.filter(doctor=request.user).order_by('-created_at')
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        
        # Validate that the doctor has access to the patient
        patient_id = request.data.get('patient')
        if not patient_id:
            return Response({'error': 'Patient ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
        except User.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if doctor-patient relationship exists
        if not DoctorPatient.objects.filter(doctor=request.user, patient=patient).exists():
            return Response({'error': 'You can only create appointments for your patients'}, status=status.HTTP_403_FORBIDDEN)
        
        # Create appointment data
        appointment_data = request.data.copy()
        appointment_data['doctor'] = request.user.id
        
        serializer = AppointmentSerializer(data=appointment_data)
        if serializer.is_valid():
            appointment = serializer.save()
            # Send SMS notification to patient
            try:
                from .utils import send_sms
                patient_phone = appointment.patient.profile.phone_number
                if patient_phone:
                    message = f"Dr. {request.user.profile.name or request.user.username} has scheduled an appointment for you on {appointment.booked_date} at {appointment.booked_time}."
                    send_sms(message, patient_phone)
            except Exception as e:
                print(f"SMS failed: {e}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, appointment_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        try:
            appointment = Appointment.objects.get(id=appointment_id, doctor=request.user)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AppointmentSerializer(appointment, data=request.data, partial=True)
        if serializer.is_valid():
            updated_appointment = serializer.save()
            # Send SMS notification to patient if status changed to accepted or booked
            if 'status' in request.data and request.data['status'] in ['accepted', 'booked']:
                try:
                    from .utils import send_sms
                    patient_phone = appointment.patient.profile.phone_number
                    if patient_phone:
                        if request.data['status'] == 'accepted':
                            message = f"Your appointment request with Dr. {request.user.profile.name or request.user.username} has been accepted."
                        else:
                            message = f"Your appointment with Dr. {request.user.profile.name or request.user.username} has been booked for {appointment.booked_date} at {appointment.booked_time}."
                        send_sms(message, patient_phone)
                except Exception as e:
                    print(f"SMS failed: {e}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Expect a refresh token in the body to blacklist
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class PatientMedicationLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        from datetime import datetime, timedelta
        now = timezone.now()
        next_hour = now + timedelta(hours=1)
        
        pending_doses = []
        prescriptions = Prescription.objects.filter(patient=request.user)
        for prescription in prescriptions:
            if prescription.duration_days and (prescription.created_at + timedelta(days=prescription.duration_days)) < now:
                continue  # Expired
            medicines = prescription.medicines
            for medicine in medicines:
                name = medicine.get('name')
                frequency = medicine.get('frequency')
                duration_str = medicine.get('duration', '7-days')
                
                if duration_str == 'ongoing':
                    duration_days = 365
                elif duration_str == 'as-needed':
                    continue
                else:
                    duration_days = int(duration_str.split('-')[0]) if '-' in duration_str else 7
                
                if frequency == 'once-daily':
                    interval_hours = 24
                elif frequency == 'twice-daily':
                    interval_hours = 12
                elif frequency == 'three-times-daily':
                    interval_hours = 8
                elif frequency == 'four-times-daily':
                    interval_hours = 6
                elif frequency == 'every-4-hours':
                    interval_hours = 4
                elif frequency == 'every-6-hours':
                    interval_hours = 6
                elif frequency == 'every-8-hours':
                    interval_hours = 8
                elif frequency == 'every-12-hours':
                    interval_hours = 12
                elif frequency == 'weekly':
                    interval_hours = 24 * 7
                elif frequency == 'monthly':
                    interval_hours = 24 * 30
                elif frequency == 'every-30-minutes':
                    interval_hours = 0.5
                elif frequency == 'as-needed':
                    continue
                else:
                    interval_hours = 24
                
                start_time = prescription.created_at
                current_time = start_time
                end_time = start_time + timedelta(days=duration_days)
                while current_time < end_time and current_time <= next_hour:
                    if current_time >= now and current_time <= next_hour:
                        # Check if already taken
                        taken = TakenDose.objects.filter(
                            prescription=prescription,
                            medicine_name=name,
                            taken_at__date=current_time.date(),
                            taken_at__hour=current_time.hour
                        ).exists()
                        if not taken:
                            pending_doses.append({
                                'id': f"{prescription.id}-{name}-{int(current_time.timestamp())}",
                                'prescription': prescription.id,
                                'prescription_title': f"Prescription by {prescription.doctor.profile.name or prescription.doctor.username}",
                                'medicine_name': name,
                                'scheduled_time': current_time,
                                'taken_at': None,
                                'status': 'pending'
                            })
                    current_time += timedelta(hours=interval_hours)
        
        # Sort by scheduled_time
        pending_doses.sort(key=lambda x: x['scheduled_time'])
        return Response(pending_doses)

    def post(self, request):
        if not request.user.groups.filter(name='Patient').exists():
            return Response({'error': 'Only patients can access this'}, status=status.HTTP_403_FORBIDDEN)
        log_id = request.data.get('log_id')
        if not log_id:
            return Response({'error': 'log_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Parse log_id: prescription_id-medicine_name-timestamp
            parts = log_id.split('-', 2)
            prescription_id = int(parts[0])
            medicine_name = parts[1]
            timestamp = int(parts[2])
            scheduled_time = datetime.fromtimestamp(timestamp)
            
            prescription = Prescription.objects.get(id=prescription_id, patient=request.user)
            
            # Check if already taken
            if TakenDose.objects.filter(
                prescription=prescription,
                medicine_name=medicine_name,
                taken_at__date=scheduled_time.date(),
                taken_at__hour=scheduled_time.hour
            ).exists():
                return Response({'error': 'Already marked'}, status=status.HTTP_400_BAD_REQUEST)
            
            TakenDose.objects.create(
                prescription=prescription,
                medicine_name=medicine_name,
                taken_at=timezone.now()
            )
            return Response({'message': 'Marked as taken'})
        except (ValueError, Prescription.DoesNotExist):
            return Response({'error': 'Invalid log_id'}, status=status.HTTP_400_BAD_REQUEST)


def test_sms(request):
    sid = send_sms("Hello from Django!", "9362993823") 
    return JsonResponse({"status": "sent", "sid": sid})


