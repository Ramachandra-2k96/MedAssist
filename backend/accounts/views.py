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
    DoctorBasicSerializer,
)
from .models import DoctorPatient, Record, AudioRecording, ChatMessage, Prescription, Profile
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
