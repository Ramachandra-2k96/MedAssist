from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import Prescription

def assign_medication(patient_id, doctor_id, medicines_list):
    """
    Assign medication to a patient by creating a prescription.

    Args:
        patient_id (int): ID of the patient user
        doctor_id (int): ID of the doctor user
        medicines_list (list): List of medicine dictionaries
    """
    try:
        doctor = User.objects.get(id=doctor_id, groups__name='Doctor')
        patient = User.objects.get(id=patient_id, groups__name='Patient')
    except User.DoesNotExist:
        raise ValueError("Invalid doctor or patient ID")

    # Calculate duration_days from medicines (take max duration or default to 7)
    duration_days = 7  # default
    for med in medicines_list:
        duration_str = med.get('duration', '7-days')
        if duration_str != 'ongoing' and duration_str != 'as-needed':
            try:
                days = int(duration_str.split('-')[0])
                if days > duration_days:
                    duration_days = days
            except (ValueError, IndexError):
                pass

    prescription = Prescription.objects.create(
        doctor=doctor,
        patient=patient,
        medicines=medicines_list,
        notes="Prescribed via script",
        duration_days=duration_days
    )
    return prescription

class Command(BaseCommand):
    help = "Seed prescriptions with hardcoded medications"

    def handle(self, *args, **options):
        # Hardcoded medications exactly as expected
        medicines = [
            {
                "name": "Paracetamol",
                "dosage": "500mg",
                "frequency": "twice-daily",
                "duration": "7-days",
                "emoji": "💊",
                "color": "#FF6B6B"
            },
            {
                "name": "Ibuprofen",
                "dosage": "200mg",
                "frequency": "three-times-daily",
                "duration": "5-days",
                "emoji": "🧴",
                "color": "#4ECDC4"
            }
        ]

        # Assuming doctor id 1 and patient id 4 exist (from seed_demo_data)
        doctor_id = 1
        patient_id = 4

        try:
            prescription = assign_medication(patient_id, doctor_id, medicines)
            self.stdout.write(
                self.style.SUCCESS(f"Created prescription ID {prescription.id} for patient {patient_id} by doctor {doctor_id}")
            )
        except ValueError as e:
            self.stdout.write(self.style.ERROR(str(e)))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error creating prescription: {str(e)}"))