from django.apps import AppConfig
import sys

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import api.signals
        
        # Connect set_unsynced_offline dynamically only to SyncableModel subclasses
        from django.db.models.signals import pre_save
        from django.apps import apps
        from api.models import SyncableModel, set_unsynced_offline
        
        for model in apps.get_models():
            if issubclass(model, SyncableModel):
                pre_save.connect(set_unsynced_offline, sender=model)

        # Avoid starting the thread during commands like migrate, shell, etc.
        if 'runserver' in sys.argv or 'gunicorn' in ''.join(sys.argv) or 'uvicorn' in ''.join(sys.argv):
            from .services.connection_monitor import ConnectionMonitor
            monitor = ConnectionMonitor()
            monitor.start()
