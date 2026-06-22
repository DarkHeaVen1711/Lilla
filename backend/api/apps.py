from django.apps import AppConfig
import sys

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import api.signals
        
        # Avoid starting the thread during commands like migrate, shell, etc.
        if 'runserver' in sys.argv or 'gunicorn' in ''.join(sys.argv) or 'uvicorn' in ''.join(sys.argv):
            from .services.connection_monitor import ConnectionMonitor
            monitor = ConnectionMonitor()
            monitor.start()
