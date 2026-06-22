from django.core.cache import cache

class HybridRouter:
    """
    A router to control all database operations on models in the
    application, redirecting to offline SQLite when disconnected.
    """
    def db_for_read(self, model, **hints):
        if cache.get('is_online', True):
            return 'default'
        return 'offline'

    def db_for_write(self, model, **hints):
        if cache.get('is_online', True):
            return 'default'
        return 'offline'

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return True
