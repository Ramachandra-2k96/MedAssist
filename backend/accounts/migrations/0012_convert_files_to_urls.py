# Generated migration to convert FileField/ImageField to URLField for GCP storage

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_medicationreminder'),
    ]

    operations = [
        # Change Profile.photo from ImageField to URLField
        migrations.AlterField(
            model_name='profile',
            name='photo',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        # Change Record.file from FileField to URLField
        migrations.AlterField(
            model_name='record',
            name='file',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        # Change AudioRecording.audio_file from FileField to URLField
        migrations.AlterField(
            model_name='audiorecording',
            name='audio_file',
            field=models.URLField(max_length=500),
        ),
    ]
