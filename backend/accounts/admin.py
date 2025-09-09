from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin
from .models import Profile, Doctor

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'

class CustomUserAdmin(UserAdmin):
    inlines = (ProfileInline,)

class DoctorAdmin(UserAdmin):
    inlines = (ProfileInline,)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(groups__name='Doctor')
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        doctor_group, created = Group.objects.get_or_create(name='Doctor')
        obj.groups.add(doctor_group)
        if not hasattr(obj, 'profile'):
            Profile.objects.create(user=obj, name=obj.first_name + ' ' + obj.last_name)

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Doctor, DoctorAdmin)
admin.site.register(Profile)
