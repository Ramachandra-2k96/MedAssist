from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User, Group
from django.db.models import Q
from django.utils import timezone
from django.http import JsonResponse
from datetime import datetime, timedelta
import logging

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
from .models import (
    DoctorPatient, 
    Record, 
    AudioRecording, 
    ChatMessage, 
    Prescription, 
    Profile, 
    Appointment, 
    TakenDose
)
from .utils import send_sms
from agno.models.cerebras import CerebrasOpenAI
from agno.agent import Agent
from backend.settings import CEREBRUS_API_KEY

logger = logging.getLogger(__name__)


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
            from .gcp_utils import delete_file, extract_blob_name_from_url
            
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
            record = Record.objects.get(id=record_id, doctor=request.user, patient=patient)
            # Only allow delete if this record was uploaded by doctor
            if record.uploaded_by != 'doctor':
                return Response({'error': 'Only the uploader can delete this record'}, status=status.HTTP_403_FORBIDDEN)
            
            # Delete the file from GCS if it exists
            if record.file:
                blob_name = extract_blob_name_from_url(record.file)
                if blob_name:
                    delete_file(blob_name)
            
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
                patient_phone = patient.profile.phone_number
                if patient_phone and recording.transcription:
                    doctor_name = request.user.profile.name or request.user.username
                    message = f"Dr. {doctor_name}: {recording.transcription}"
                    send_sms(message, patient_phone)
                    logger.info(f"SMS sent to patient {patient.id} for recording {recording.id}")
            except Exception as e:
                logger.error(f"Failed to send SMS to patient {patient.id}: {str(e)}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, patient_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        recording_id = request.data.get('recording_id')
        if not recording_id:
            return Response({'error': 'Recording ID required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from .gcp_utils import delete_file, extract_blob_name_from_url
            
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
            recording = AudioRecording.objects.get(id=recording_id, doctor=request.user, patient=patient)
            # Only allow delete if this recording was uploaded by doctor
            if recording.uploaded_by != 'doctor':
                return Response({'error': 'Only the uploader can delete this recording'}, status=status.HTTP_403_FORBIDDEN)
            
            # Delete the audio file from GCS if it exists
            if recording.audio_file:
                blob_name = extract_blob_name_from_url(recording.audio_file)
                if blob_name:
                    delete_file(blob_name)
            
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


class DoctorSendPrescriptionsSMSView(APIView):
    """Allow a doctor to send all prescriptions they set for a given patient as an SMS message."""
    permission_classes = [IsAuthenticated]

    def post(self, request, patient_id):
        # Only doctors may call this
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)

        try:
            patient = User.objects.get(id=patient_id, groups__name='Patient')
            DoctorPatient.objects.get(doctor=request.user, patient=patient)
        except (User.DoesNotExist, DoctorPatient.DoesNotExist):
            return Response({'error': 'Patient not found or not associated'}, status=status.HTTP_404_NOT_FOUND)

        # Fetch prescriptions authored by this doctor for the patient
        prescriptions = Prescription.objects.filter(doctor=request.user, patient=patient).order_by('-created_at')
        if not prescriptions.exists():
            return Response({'error': 'No prescriptions found for this patient by you'}, status=status.HTTP_404_NOT_FOUND)

        # Build a human-readable message
        lines = []
        doctor_name = request.user.profile.name or request.user.username
        header = f"Dr. {doctor_name} - Your prescriptions:\n"
        lines.append(header)
        for p in prescriptions:
            for m in p.medicines:
                name = m.get('name', '')
                dosage = m.get('dosage', '')
                freq = m.get('frequency', '')
                duration = m.get('duration', '')
                if name:  # Only add if medicine has a name
                    lines.append(f"- {name} {dosage} | {freq} | {duration}")

        # Optional notes (append latest notes)
        latest_notes = '\n'.join([p.notes for p in prescriptions if p.notes])
        if latest_notes:
            lines.append('\nNotes:')
            # Truncate notes to keep SMS length reasonable
            notes_text = latest_notes
            if len(notes_text) > 500:
                notes_text = notes_text[:497] + '...'
            lines.append(notes_text)

        message_text = '\n'.join(lines)

        # Send SMS using existing utility
        try:
            patient_phone = patient.profile.phone_number
            if not patient_phone:
                return Response({'error': 'Patient has no phone number'}, status=status.HTTP_400_BAD_REQUEST)
            sid = send_sms(message_text, patient_phone)
            logger.info(f"Prescription SMS sent to patient {patient.id}, SID: {sid}")
            return Response({'message': 'Sent', 'sid': sid}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to send prescription SMS to patient {patient.id}: {str(e)}")
            return Response({'error': f'Failed to send SMS: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            from .gcp_utils import delete_file, extract_blob_name_from_url
            
            record = Record.objects.get(id=record_id, patient=request.user)
            if record.uploaded_by != 'patient':
                return Response({'error': 'Cannot delete doctor uploaded record'}, status=status.HTTP_403_FORBIDDEN)
            # Delete file from GCS
            if record.file:
                blob_name = extract_blob_name_from_url(record.file)
                if blob_name:
                    delete_file(blob_name)
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
            from .gcp_utils import delete_file, extract_blob_name_from_url
            
            rec = AudioRecording.objects.get(id=rec_id, patient=request.user)
            if rec.uploaded_by != 'patient':
                return Response({'error': 'Cannot delete doctor uploaded recording'}, status=status.HTTP_403_FORBIDDEN)
            if rec.audio_file:
                blob_name = extract_blob_name_from_url(rec.audio_file)
                if blob_name:
                    delete_file(blob_name)
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
            instructions="""
            You are a helpful health assistant that always answers only health-related queries. 
            Engage in casual, natural conversation while focusing exclusively on medical, wellness, and health topics. 

            Act like an intern doctor: carefully analyze symptoms, ask clarifying questions, and provide possible explanations of what might be happening. 
            If you think the situation is serious, suggest that the patient see a qualified doctor immediately. 

            Never prescribe medications directly. Instead, provide supportive advice, lifestyle guidance, and when appropriate, recommend consulting a healthcare professional. 

            Ask clarifying questions **strictly one at a time**. 
            - After asking a question, wait for the patient’s response before asking the next. 
            - Never list multiple questions in the same reply. 
            - If you need more information, ask the most important next question only. 

            You must never refuse to answer health-related queries. 
            Do not reveal that you are an AI or mention your underlying technology. 
            If a question is outside the scope of health, politely steer the conversation back to health-related concerns.  

            You also have tools to save the memory of the current conversation and to retrieve relevant information from previous conversations, and you should use them naturally when needed.

            """,
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
                doctor_phone = doctor.profile.phone_number
                if doctor_phone:
                    message = f"New appointment request from {request.user.profile.name or request.user.username}"
                    send_sms(message, doctor_phone)
                    logger.info(f"Appointment notification sent to doctor {doctor.id}")
            except Exception as e:
                logger.error(f"Failed to send appointment SMS to doctor {doctor.id}: {str(e)}")
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
        
        # Check if booked_date and booked_time are provided and slot is available (15-min buffer)
        booked_date = request.data.get('booked_date')
        booked_time = request.data.get('booked_time')
        if booked_date and booked_time:
            if not self._is_slot_available(request.user, booked_date, booked_time):
                logger.warning(f"Slot conflict for doctor {request.user.id}: {booked_date} {booked_time}")
                return Response(
                    {'error': 'This time slot is already booked. Please select a different date or time (appointments must be at least 15 minutes apart).'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create appointment data
        appointment_data = request.data.copy()
        appointment_data['doctor'] = request.user.id
        
        serializer = AppointmentSerializer(data=appointment_data)
        if serializer.is_valid():
            appointment = serializer.save()
            # Send SMS notification to patient
            try:
                patient_phone = appointment.patient.profile.phone_number
                if patient_phone:
                    message = f"Dr. {request.user.profile.name or request.user.username} has scheduled an appointment for you on {appointment.booked_date} at {appointment.booked_time}."
                    send_sms(message, patient_phone)
                    logger.info(f"Appointment SMS sent to patient {appointment.patient.id}")
            except Exception as e:
                logger.error(f"Failed to send appointment SMS to patient {appointment.patient.id}: {str(e)}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, appointment_id):
        if not request.user.groups.filter(name='Doctor').exists():
            return Response({'error': 'Only doctors can access this'}, status=status.HTTP_403_FORBIDDEN)
        try:
            appointment = Appointment.objects.get(id=appointment_id, doctor=request.user)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if booked_date and booked_time are being updated and slot is available (15-min buffer)
        booked_date = request.data.get('booked_date')
        booked_time = request.data.get('booked_time')
        if booked_date and booked_time:
            if not self._is_slot_available(request.user, booked_date, booked_time, exclude_appointment_id=appointment_id):
                logger.warning(f"Slot conflict for doctor {request.user.id} updating appointment {appointment_id}: {booked_date} {booked_time}")
                return Response(
                    {'error': 'This time slot is already booked. Please select a different date or time (appointments must be at least 15 minutes apart).'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = AppointmentSerializer(appointment, data=request.data, partial=True)
        if serializer.is_valid():
            updated_appointment = serializer.save()
            # Send SMS notification to patient if status changed to accepted or booked
            if 'status' in request.data and request.data['status'] in ['accepted', 'booked']:
                try:
                    patient_phone = appointment.patient.profile.phone_number
                    if patient_phone:
                        if request.data['status'] == 'accepted':
                            message = f"Your appointment request with Dr. {request.user.profile.name or request.user.username} has been accepted."
                        else:
                            message = f"Your appointment with Dr. {request.user.profile.name or request.user.username} has been booked for {appointment.booked_date} at {appointment.booked_time}."
                        send_sms(message, patient_phone)
                        logger.info(f"Appointment update SMS sent to patient {appointment.patient.id}")
                except Exception as e:
                    logger.error(f"Failed to send appointment update SMS to patient {appointment.patient.id}: {str(e)}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _is_slot_available(self, doctor, booked_date, booked_time, exclude_appointment_id=None):
        """Check if a slot is available for the doctor (with 15-min buffer)."""
        import datetime as dt_module
        
        # Parse the requested slot
        try:
            if isinstance(booked_date, dt_module.date):
                date_obj = booked_date
            else:
                date_obj = datetime.strptime(booked_date, '%Y-%m-%d').date()
            
            if isinstance(booked_time, dt_module.time):
                time_obj = booked_time
            else:
                time_str = str(booked_time)
                if len(time_str.split(':')) == 3:
                    time_obj = datetime.strptime(time_str, '%H:%M:%S').time()
                else:
                    time_obj = datetime.strptime(time_str, '%H:%M').time()
            
            requested_datetime = datetime.combine(date_obj, time_obj)
        except Exception as e:
            logger.error(f"Error parsing date/time: {e}")
            return False
        
        # Get all booked appointments for this doctor on the same date
        existing_appointments = Appointment.objects.filter(
            doctor=doctor,
            booked_date=booked_date,
            status='booked'
        )
        
        # Exclude current appointment if updating
        if exclude_appointment_id:
            existing_appointments = existing_appointments.exclude(id=exclude_appointment_id)
        
        # Check if any existing appointment conflicts (within 15 minutes)
        buffer_minutes = 15
        for appt in existing_appointments:
            if appt.booked_time:
                existing_datetime = datetime.combine(appt.booked_date, appt.booked_time)
                time_diff = abs((requested_datetime - existing_datetime).total_seconds() / 60)
                if time_diff < buffer_minutes:
                    return False
        
        return True


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


