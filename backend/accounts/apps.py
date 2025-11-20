from django.apps import AppConfig
from django.conf import settings
import sys
import os

class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        # Start the scheduler only once, avoiding double execution in dev mode
        # RUN_MAIN is set by Django's autoreloader after the first startup
        if os.environ.get('RUN_MAIN') == 'true' and 'runserver' in sys.argv:
            from accounts import scheduler
            scheduler.start()
        
        # Set up WAL mode using connection_created signal (avoids RuntimeWarning)
        if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
            from django.db.backends.signals import connection_created
            
            def enable_wal_mode(sender, connection, **kwargs):
                """Enable WAL mode when a database connection is created."""
                if connection.vendor == 'sqlite':
                    cursor = connection.cursor()
                    cursor.execute('PRAGMA journal_mode=WAL;')
                    cursor.close()
            
            connection_created.connect(enable_wal_mode)
