import threading
import time
from django.core.cache import cache
from django.db import connections
from django.db.utils import OperationalError

class ConnectionMonitor(threading.Thread):
    def __init__(self, interval=10):
        super().__init__()
        self.interval = interval
        self.daemon = True
        self._stop_event = threading.Event()

    def run(self):
        # Initial wait to let Django boot up
        time.sleep(5)
        while not self._stop_event.is_set():
            try:
                # Attempt to ping the default database (Supabase)
                connection = connections['default']
                # executing a lightweight query to ensure connection
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                
                was_online = cache.get('is_online', True)
                if not was_online:
                    print("[Monitor] Connection restored. Triggering Sync Engine...")
                    cache.set('is_online', True, timeout=None)
                    
                    from .sync_engine import SyncEngine
                    threading.Thread(target=SyncEngine.run_sync, daemon=True).start()
                else:
                    cache.set('is_online', True, timeout=None)
                    
            except OperationalError:
                was_online = cache.get('is_online', True)
                if was_online:
                    print("[Monitor] Connection lost! Falling back to offline database.")
                cache.set('is_online', False, timeout=None)
                
            except Exception as e:
                pass
                
            time.sleep(self.interval)

    def stop(self):
        self._stop_event.set()
