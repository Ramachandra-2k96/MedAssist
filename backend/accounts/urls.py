from django.urls import path
from .views import SignupView, LoginView, DoctorPatientsView, PatientRecordsView, PatientAudioRecordingsView, PatientChatView, PatientPrescriptionsView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('doctor/patients/', DoctorPatientsView.as_view(), name='doctor_patients'),
    path('doctor/patients/<int:patient_id>/records/', PatientRecordsView.as_view(), name='patient_records'),
    path('doctor/patients/<int:patient_id>/audio/', PatientAudioRecordingsView.as_view(), name='patient_audio'),
    path('doctor/patients/<int:patient_id>/chat/', PatientChatView.as_view(), name='patient_chat'),
    path('doctor/patients/<int:patient_id>/prescriptions/', PatientPrescriptionsView.as_view(), name='patient_prescriptions'),
]
