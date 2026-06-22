import logging
from django.apps import apps
from django.db import connections
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger('lilla.transaction')

class SyncEngine:
    @classmethod
    def run_sync(cls):
        print("[SyncEngine] Starting synchronization process...")
        logger.info("SyncEngine started.")
        app_config = apps.get_app_config('api')
        
        for model in app_config.get_models():
            has_synced = any(f.name == 'is_synced' for f in model._meta.fields)
            if has_synced:
                # Using an iterator for potentially large queries
                unsynced_qs = model.objects.using('offline').filter(is_synced=False).iterator()
                for obj in unsynced_qs:
                    try:
                        # Attempt to find remote equivalent
                        remote_obj = model.objects.using('default').get(pk=obj.pk)
                        has_updated = any(f.name == 'updated_at' for f in model._meta.fields)
                        if has_updated and getattr(obj, 'updated_at', None) and getattr(remote_obj, 'updated_at', None):
                            # Resolve using Last-Write-Wins
                            if obj.updated_at > remote_obj.updated_at:
                                obj.is_synced = True
                                obj.save(using='default')
                        else:
                            obj.is_synced = True
                            obj.save(using='default')
                    except ObjectDoesNotExist:
                        # Remote object doesn't exist, we must create it
                        obj.is_synced = True
                        try:
                            obj.save(using='default')
                        except Exception as inner_e:
                            # Fallback if DB expects force_insert
                            obj.save(using='default', force_insert=True)
                    except Exception as e:
                        logger.error(f"SyncEngine error for {model.__name__} {obj.pk}: {e}")
                        continue
                        
                    # Successfully synced, mark local record as synced
                    obj.is_synced = True
                    obj.save(using='offline')
        
        print("[SyncEngine] Synchronization process complete.")
        logger.info("SyncEngine completed.")
