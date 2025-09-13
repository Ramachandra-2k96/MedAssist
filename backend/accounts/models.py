from django.db import models
from django.contrib.auth.models import User, Group
from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import datetime, timedelta

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, blank=True)
    photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True)

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
    duration_days = models.PositiveIntegerField(default=7)  # Duration in days for the prescription
    last_reminder_sent = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prescription by {self.doctor.username} for {self.patient.username}"

class TakenDose(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='taken_doses')
    medicine_name = models.CharField(max_length=100)
    taken_at = models.DateTimeField()

    class Meta:
        unique_together = ('prescription', 'medicine_name', 'taken_at')

    def __str__(self):
        return f"{self.medicine_name} taken at {self.taken_at}"


class MedicationReminder(models.Model):
    """Tracks which scheduled dose-times we've already reminded for.

    This enables sending one SMS per missed scheduled_time (accurate for high-frequency meds).
    """
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='reminders')
    medicine_name = models.CharField(max_length=100)
    scheduled_time = models.DateTimeField()
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('prescription', 'medicine_name', 'scheduled_time')

    def __str__(self):
        return f"Reminder for {self.medicine_name} at {self.scheduled_time}"

class Appointment(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments', limit_choices_to={'groups__name': 'Doctor'})
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_appointments', limit_choices_to={'groups__name': 'Patient'})
    requested_start_date = models.DateField(null=True, blank=True)
    requested_end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('booked', 'Booked'),
        ('cancelled', 'Cancelled')
    ], default='pending')
    booked_date = models.DateField(null=True, blank=True)
    booked_time = models.TimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Appointment: {self.patient.username} with {self.doctor.username} - {self.status}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
