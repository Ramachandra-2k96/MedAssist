from accounts.models import TakenDose, Prescription, MedicationReminder
from accounts.utils import send_sms
from datetime import datetime, timedelta, time as dt_time
from django.utils import timezone
import logging

logger = logging.getLogger('accounts.cron')


def send_medication_reminders():
    now = timezone.now()
    grace_period = now - timedelta(minutes=10)  # 10 min grace
    logger.info("Cron job started")
    prescriptions = Prescription.objects.all()
    for prescription in prescriptions:
        # skip expired
        if prescription.duration_days and (prescription.created_at + timedelta(days=prescription.duration_days)) < now:
            continue

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

            # Human-friendly fixed times for common daily frequencies
            fixed_times_map = {
                'once-daily': ['08:00'],
                'twice-daily': ['08:00', '20:00'],
                'three-times-daily': ['08:00', '14:00', '20:00'],
                'four-times-daily': ['06:00', '12:00', '18:00', '00:00'],
            }

            if frequency in fixed_times_map:
                fixed_times = fixed_times_map[frequency]
                interval_hours = None
            else:
                fixed_times = None
                if frequency == 'every-4-hours':
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
                else:
                    interval_hours = 24

            # Fixed-times schedule handling
            if fixed_times:
                created_local = prescription.created_at
                # if created at/after noon, start next day
                noon = dt_time(12, 0)
                if created_local.time() >= noon:
                    day_start = (created_local + timedelta(days=1)).date()
                else:
                    day_start = created_local.date()

                for day_offset in range(duration_days):
                    scheduled_date = day_start + timedelta(days=day_offset)
                    for t in fixed_times:
                        hour, minute = map(int, t.split(':'))
                        naive_dt = datetime.combine(scheduled_date, dt_time(hour, minute))
                        scheduled_dt = timezone.make_aware(naive_dt)

                        # only consider scheduled times that have passed the grace period
                        if scheduled_dt > grace_period:
                            continue

                        # Don't schedule beyond prescription end
                        if scheduled_dt >= (prescription.created_at + timedelta(days=duration_days)):
                            continue

                        # Skip if already reminded
                        if MedicationReminder.objects.filter(prescription=prescription, medicine_name=name, scheduled_time=scheduled_dt).exists():
                            continue

                        # detection window: ±15 minutes for clock-based schedules
                        window_minutes = 15
                        window_start = scheduled_dt - timedelta(minutes=window_minutes)
                        window_end = scheduled_dt + timedelta(minutes=window_minutes)
                        taken = TakenDose.objects.filter(
                            prescription=prescription,
                            medicine_name=name,
                            taken_at__gte=window_start,
                            taken_at__lte=window_end,
                        ).exists()
                        if not taken:
                            patient_phone = prescription.patient.profile.phone_number
                            if patient_phone:
                                message = f"Reminder: You missed your {name} dose scheduled at {scheduled_dt.strftime('%H:%M on %Y-%m-%d')}. Please log in to the portal to mark it as taken."
                                send_sms(message, patient_phone)
                                try:
                                    MedicationReminder.objects.create(
                                        prescription=prescription,
                                        medicine_name=name,
                                        scheduled_time=scheduled_dt,
                                    )
                                except Exception:
                                    pass

            else:
                # interval-based schedule handling
                start_time = prescription.created_at
                current_time = start_time
                end_time = start_time + timedelta(days=duration_days)
                while current_time < end_time and current_time <= grace_period:
                    if MedicationReminder.objects.filter(prescription=prescription, medicine_name=name, scheduled_time=current_time).exists():
                        current_time += timedelta(hours=interval_hours)
                        continue

                    window_minutes = max(1, int((interval_hours * 60) / 4))
                    window_minutes = min(window_minutes, 15)
                    window_start = current_time - timedelta(minutes=window_minutes)
                    window_end = current_time + timedelta(minutes=window_minutes)
                    taken = TakenDose.objects.filter(
                        prescription=prescription,
                        medicine_name=name,
                        taken_at__gte=window_start,
                        taken_at__lte=window_end,
                    ).exists()
                    if not taken:
                        patient_phone = prescription.patient.profile.phone_number
                        if patient_phone:
                            message = f"Reminder: You missed your {name} dose scheduled at {current_time.strftime('%H:%M on %Y-%m-%d')}. Please log in to the portal to mark it as taken."
                            send_sms(message, patient_phone)
                            try:
                                MedicationReminder.objects.create(
                                    prescription=prescription,
                                    medicine_name=name,
                                    scheduled_time=current_time,
                                )
                            except Exception:
                                pass
                    current_time += timedelta(hours=interval_hours)

    # Delete expired prescriptions
    expired_prescriptions = Prescription.objects.filter(created_at__date__lte=now.date() - timedelta(days=1))
    for prescription in expired_prescriptions:
        if prescription.duration_days and (now.date() - prescription.created_at.date()).days >= prescription.duration_days:
            prescription.delete()