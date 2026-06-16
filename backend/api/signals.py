import os
import threading
import logging
import requests
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Product, Combo

logger = logging.getLogger(__name__)

def send_revalidation_request(tags):
    def run():
        url = os.getenv("NEXTJS_REVALIDATE_URL", "http://localhost:3000/api/revalidate")
        secret = os.getenv("REVALIDATION_SECRET", "default_revalidation_secret")
        
        headers = {
            "Content-Type": "application/json",
            "x-revalidate-secret": secret
        }
        payload = {
            "tags": tags
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=5)
            logger.info(f"Sent revalidation request to {url} for tags {tags}. Status: {response.status_code}")
        except Exception as e:
            logger.warning(f"Error sending revalidation request to {url}: {e}")

    # Launch asynchronously in a daemon thread so database writes are not blocked
    thread = threading.Thread(target=run)
    thread.daemon = True
    thread.start()

@receiver(post_save, sender=Product)
@receiver(post_delete, sender=Product)
def product_changed_signal(sender, instance, **kwargs):
    tags = ["products", f"product-{instance.slug}"]
    send_revalidation_request(tags)

@receiver(post_save, sender=Combo)
@receiver(post_delete, sender=Combo)
def combo_changed_signal(sender, instance, **kwargs):
    tags = ["combos", f"combo-{instance.slug}"]
    send_revalidation_request(tags)
