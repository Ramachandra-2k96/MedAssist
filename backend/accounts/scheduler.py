from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from accounts.cron import send_medication_reminders
import logging

logger = logging.getLogger(__name__)

def start():
    scheduler = BackgroundScheduler()
    
    # Use MemoryJobStore instead of DjangoJobStore to avoid SQLite locking issues
    # Note: Jobs won't persist across restarts, but that's fine for this use case
    jobstores = {
        'default': MemoryJobStore()
    }
    scheduler.add_jobstore(jobstores['default'], 'default')
    
    # Run every 1 minute for testing as requested
    # TODO: Change to 20 minutes after testing: minutes=20
    scheduler.add_job(
        send_medication_reminders, 
        'interval', 
        minutes=1, 
        id='send_medication_reminders', 
        replace_existing=True,
        max_instances=1  # Prevent multiple instances running simultaneously
    )
    
    try:
        scheduler.start()
        logger.info("Scheduler started with MemoryJobStore (no DB persistence)")
    except Exception as e:
        logger.error(f"Error starting scheduler: {e}")
