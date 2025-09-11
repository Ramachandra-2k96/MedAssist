from django.urls import path
from .views import (
    SignupView,
    LoginView,
    DoctorPatientsView,
    PatientRecordsView,
    PatientAudioRecordingsView,
    PatientChatView,
    PatientPrescriptionsView,
    DoctorProfileView,
    PatientDashboardDataView,
    PatientRecordsManageView,
    PatientAudioManageView,
    PatientChatManageView,
    PatientPrescriptionsViewPublic,
    PatientDoctorsView,
)
from .views import LogoutView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('doctor/patients/', DoctorPatientsView.as_view(), name='doctor_patients'),
    path('doctor/patients/<int:patient_id>/records/', PatientRecordsView.as_view(), name='patient_records'),
    path('doctor/patients/<int:patient_id>/audio/', PatientAudioRecordingsView.as_view(), name='patient_audio'),
    path('doctor/patients/<int:patient_id>/chat/', PatientChatView.as_view(), name='patient_chat'),
    path('doctor/patients/<int:patient_id>/prescriptions/', PatientPrescriptionsView.as_view(), name='patient_prescriptions'),
    path('doctor/profile/', DoctorProfileView.as_view(), name='doctor_profile'),
    # Patient self-service endpoints
    path('patient/dashboard/', PatientDashboardDataView.as_view(), name='patient_dashboard_data'),
    path('patient/records/', PatientRecordsManageView.as_view(), name='patient_records_manage'),
    path('patient/audio/', PatientAudioManageView.as_view(), name='patient_audio_manage'),
    path('patient/chat/', PatientChatManageView.as_view(), name='patient_chat_manage'),
    path('patient/prescriptions/', PatientPrescriptionsViewPublic.as_view(), name='patient_prescriptions_public'),
    path('patient/doctors/', PatientDoctorsView.as_view(), name='patient_doctors'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
