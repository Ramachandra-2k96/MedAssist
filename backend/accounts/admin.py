from django import forms
from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import Profile, Doctor


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'


class CustomUserAdmin(UserAdmin):
    inlines = (ProfileInline,)


class DoctorCreationForm(UserCreationForm):
    """Custom form for creating doctor users via admin. Requires email and username."""

    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name")

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if not email:
            raise forms.ValidationError("Email is required for doctor accounts.")
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("A user with this email already exists.")
        return email


class DoctorChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", "is_active")


class DoctorAdmin(UserAdmin):
    form = DoctorChangeForm
    add_form = DoctorCreationForm
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(groups__name='Doctor')

    def save_model(self, request, obj, form, change):
        is_new = obj._state.adding
        super().save_model(request, obj, form, change)
        doctor_group, created = Group.objects.get_or_create(name='Doctor')
        obj.groups.add(doctor_group)
        # ensure profile exists and has a name
        if not hasattr(obj, 'profile'):
            Profile.objects.create(user=obj, name=(obj.first_name + ' ' + obj.last_name).strip())


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Doctor, DoctorAdmin)
admin.site.register(Profile)
