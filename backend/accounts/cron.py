from accounts.models import TakenDose, Prescription, MedicationReminder
from accounts.utils import send_sms
from datetime import datetime, timedelta
from django.utils import timezone
import logging

logger = logging.getLogger('accounts.cron')

def send_medication_reminders():
    now = timezone.now()
    grace_period = now - timedelta(minutes=1)  # 10 min grace
    logger.info("Cron job started")
    prescriptions = Prescription.objects.all()
    for prescription in prescriptions:
        if prescription.duration_days and (prescription.created_at + timedelta(days=prescription.duration_days)) < now:
            continue  # Expired
        
        # No global 24-hour throttle anymore. We'll track reminders per scheduled_time.
        
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
            # Walk scheduled times up to the grace period and send reminder per scheduled_time
            while current_time < end_time and current_time <= grace_period:
                # Check if this scheduled_time was already reminded
                already_reminded = MedicationReminder.objects.filter(
                    prescription=prescription,
                    medicine_name=name,
                    scheduled_time=current_time
                ).exists()
                if not already_reminded:
                    # Check if taken within a small window around scheduled_time (± interval/4)
                    window_minutes = max(1, int((interval_hours * 60) / 4))
                    window_start = current_time - timedelta(minutes=window_minutes)
                    window_end = current_time + timedelta(minutes=window_minutes)
                    taken = TakenDose.objects.filter(
                        prescription=prescription,
                        medicine_name=name,
                        taken_at__gte=window_start,
                        taken_at__lte=window_end
                    ).exists()
                    if not taken:
                        # Missed this scheduled dose -> send reminder and record it
                        patient_phone = prescription.patient.profile.phone_number
                        if patient_phone:
                            message = f"Reminder: You missed your {name} dose scheduled at {current_time.strftime('%H:%M on %Y-%m-%d')}. Please log in to the portal to mark it as taken."
                            send_sms(message, patient_phone)
                            try:
                                MedicationReminder.objects.create(
                                    prescription=prescription,
                                    medicine_name=name,
                                    scheduled_time=current_time
                                )
                            except Exception:
                                # ignore duplicate creation races
                                pass
                current_time += timedelta(hours=interval_hours)

    # Delete expired prescriptions
    expired_prescriptions = Prescription.objects.filter(
        created_at__date__lte=now.date() - timedelta(days=1)
    )
    for prescription in expired_prescriptions:
        if prescription.duration_days and (now.date() - prescription.created_at.date()).days >= prescription.duration_days:
            prescription.delete()