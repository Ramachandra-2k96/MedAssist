from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from accounts.models import Profile, DoctorPatient


class Command(BaseCommand):
    help = "Seed the database with 3 doctors and 10 patients, and link them."

    def handle(self, *args, **options):
        # Ensure groups exist
        doctor_group, _ = Group.objects.get_or_create(name='Doctor')
        patient_group, _ = Group.objects.get_or_create(name='Patient')

        # Create doctors
        doctors = []
        for i in range(1, 4):
            email = f"doctor{i}@example.com"
            username = email
            user, created = User.objects.get_or_create(username=username, defaults={
                'email': email
            })
            if created:
                user.set_password('Password123!')
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created doctor: {email}"))
            # ensure group
            user.groups.add(doctor_group)
            # name on profile
            user.profile.name = f"Doctor {i}"
            user.profile.phone_number = f"+91935386742{i}"
            user.profile.save()
            doctors.append(user)

        # Create patients
        patients = []
        for i in range(1, 11):
            email = f"patient{i}@example.com"
            username = email
            user, created = User.objects.get_or_create(username=username, defaults={
                'email': email
            })
            if created:
                user.set_password('Password123!')
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created patient: {email}"))
            user.groups.add(patient_group)
            user.profile.name = f"Patient {i}"
            user.profile.phone_number = f"+91935386743{i}"
            user.profile.save()
            patients.append(user)

        # Link all patients to all doctors
        total_links = 0
        for d in doctors:
            for p in patients:
                _, created = DoctorPatient.objects.get_or_create(doctor=d, patient=p)
                if created:
                    total_links += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seeding complete: {len(doctors)} doctors, {len(patients)} patients, {total_links} links."
        ))
