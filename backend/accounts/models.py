from django.db import models
from django.contrib.auth.models import User, Group
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.user.groups.first().name if self.user.groups.exists() else 'No Group'}"

class Doctor(User):
    class Meta:
        proxy = True
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'

class DoctorPatient(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_patients', limit_choices_to={'groups__name': 'Doctor'})
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_doctors', limit_choices_to={'groups__name': 'Patient'})
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('doctor', 'patient')

    def __str__(self):
        return f"{self.doctor.username} - {self.patient.username}"

class Record(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_records', limit_choices_to={'groups__name': 'Doctor'})
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_records', limit_choices_to={'groups__name': 'Patient'})
    type = models.CharField(max_length=100, default='General')
    title = models.CharField(max_length=200, default='Record')
    file = models.FileField(upload_to='records/', blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.CharField(max_length=10, default='doctor')

    def __str__(self):
        return f"Record by {self.doctor.username} for {self.patient.username}"

class AudioRecording(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_audio_recordings', limit_choices_to={'groups__name': 'Doctor'})
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_audio_recordings', limit_choices_to={'groups__name': 'Patient'})
    title = models.CharField(max_length=200, default='Recording')
    audio_file = models.FileField(upload_to='audio/')
    transcription = models.TextField(blank=True)
    language = models.CharField(max_length=10, default='en')
    recorded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.CharField(max_length=10, default='doctor')

    def __str__(self):
        return f"Audio by {self.doctor.username} for {self.patient.username}"

class ChatMessage(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_chat_messages', limit_choices_to={'groups__name': 'Doctor'})
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_chat_messages', limit_choices_to={'groups__name': 'Patient'})
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    sender = models.CharField(max_length=10, choices=[('doctor', 'Doctor'), ('patient', 'Patient')])

    def __str__(self):
        return f"Message from {self.sender} at {self.timestamp}"

class Prescription(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_prescriptions', limit_choices_to={'groups__name': 'Doctor'})
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_prescriptions', limit_choices_to={'groups__name': 'Patient'})
    medicines = models.JSONField()  # List of medicines
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prescription by {self.doctor.username} for {self.patient.username}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
