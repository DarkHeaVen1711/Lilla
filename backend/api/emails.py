import decimal
import threading
import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)

def send_email_async(email_msg):
    def run():
        try:
            email_msg.send()
        except Exception as e:
            logger.error(f"Failed to send email: {e}")

    if getattr(settings, 'EMAIL_BACKEND', '') == 'django.core.mail.backends.locmem.EmailBackend':
        run()
    else:
        thread = threading.Thread(target=run)
        thread.daemon = True
        thread.start()

def send_html_invoice_email(order):
    def run():
        try:
            # Calculate pricing breakdown
            subtotal = sum(item.price * item.quantity for item in order.items.all())
            discount = order.discount_amount
            delivery_fee = decimal.Decimal("15.00")
            total = order.total_price

            context = {
                'order': order,
                'items': order.items.all(),
                'subtotal': float(subtotal),
                'delivery_fee': float(delivery_fee),
                'discount': float(discount),
                'total': float(total),
            }

            # Compile HTML template
            html_content = render_to_string('emails/invoice.html', context)

            # Compile plain-text fallback content
            text_content = f"LILLA - Order Confirmation & Invoice\n\n" \
                           f"Thank you for your purchase! Here is your invoice for order {order.id}.\n\n" \
                           f"Delivery Details:\n" \
                           f"{order.shipping_name}\n" \
                           f"{order.shipping_address}\n" \
                           f"{order.shipping_city}, {order.shipping_postal_code}\n\n" \
                           f"Items Purchased:\n"
            for item in order.items.all():
                text_content += f"- {item.product_name} x {item.quantity}: ${item.price * item.quantity:.2f}\n"
            
            text_content += f"\nSubtotal: ${subtotal:.2f}\n"
            if discount > 0:
                text_content += f"Discount ({order.coupon_code}): -${discount:.2f}\n"
            text_content += f"Delivery Fee: ${delivery_fee:.2f}\n"
            text_content += f"Total Paid: ${total:.2f}\n\n" \
                            f"If you have any questions, please contact support@lilla.com."

            subject = f"Invoice for your LILLA Order {str(order.id)[:8].upper()}"
            recipient_email = order.user_identifier.strip()
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'LILLA <noreply@lilla.com>')

            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[recipient_email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
            logger.info(f"Invoice email successfully sent to {recipient_email} for order {order.id}")
        except Exception as e:
            logger.error(f"Failed to send invoice email for order {order.id}: {e}")

    # Run synchronously during testing to avoid race conditions and outbox pollution.
    # Otherwise, execute asynchronously in a daemon thread.
    if getattr(settings, 'EMAIL_BACKEND', '') == 'django.core.mail.backends.locmem.EmailBackend':
        run()
    else:
        thread = threading.Thread(target=run)
        thread.daemon = True
        thread.start()
