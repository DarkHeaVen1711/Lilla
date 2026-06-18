import os
import decimal
import stripe
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from api.models import Order, Product

stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', os.getenv('STRIPE_SECRET_KEY', 'sk_test_PlaceholderSecretKey'))

class CreatePaymentIntentView(APIView):
    def post(self, request, *args, **kwargs):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'error': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        order = get_object_or_404(Order, id=order_id)
        
        # Security: Recalculate price server-side using actual Product database prices
        calculated_subtotal = decimal.Decimal('0.00')
        for item in order.items.all():
            try:
                product = Product.objects.get(id=item.product_id)
                calculated_subtotal += product.price * item.quantity
            except Product.DoesNotExist:
                return Response(
                    {'error': f"Product '{item.product_name}' no longer exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        # Match OrderSerializer validation formula: subtotal - order.discount_amount + 15.00 delivery fee
        discount = order.discount_amount
        delivery_fee = decimal.Decimal('15.00')
        calculated_total = calculated_subtotal - discount + delivery_fee
        
        # Stripe expects amount in cents (integer)
        amount_cents = int(calculated_total * 100)
        
        try:
            # Create a Stripe PaymentIntent
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                metadata={
                    'order_id': str(order.id),
                    'user_identifier': order.user_identifier
                }
            )
            
            # Save Stripe PaymentIntent ID to the order
            order.payment_intent_id = intent.id
            order.save()
            
            return Response({
                'client_secret': intent.client_secret,
                'payment_intent_id': intent.id,
                'amount': float(calculated_total)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': f"Stripe payment intent creation failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


import logging
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse

transaction_logger = logging.getLogger('lilla.transaction')

@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(View):
    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

        if not sig_header:
            transaction_logger.error(
                "Stripe Webhook Signature Missing",
                extra={'context': {'status': 'missing_signature'}}
            )
            return HttpResponse("Missing signature", status=400)

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            transaction_logger.error(
                "Stripe Webhook Invalid Payload",
                extra={'context': {'status': 'invalid_payload', 'error': str(e)}}
            )
            return HttpResponse("Invalid payload", status=400)
        except stripe.error.SignatureVerificationError as e:
            transaction_logger.error(
                "Stripe Webhook Signature Verification Failed",
                extra={'context': {'status': 'invalid_signature', 'error': str(e)}}
            )
            return HttpResponse("Invalid signature", status=400)

        event_type = event['type']
        
        if event_type == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            pi_id = payment_intent['id']
            order_id = payment_intent.get('metadata', {}).get('order_id')
            
            order = None
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                except Order.DoesNotExist:
                    pass
            
            if not order:
                order = Order.objects.filter(payment_intent_id=pi_id).first()

            if order:
                if order.status != 'Paid':
                    order.status = 'Paid'
                    order.save()
                    transaction_logger.info(
                        f"Order {order.id} marked as Paid via webhook",
                        extra={'context': {'order_id': str(order.id), 'payment_intent_id': pi_id, 'status': 'Paid'}}
                    )
            else:
                transaction_logger.warning(
                    f"Order not found for PaymentIntent {pi_id}",
                    extra={'context': {'payment_intent_id': pi_id}}
                )
        elif event_type in ['payment_intent.payment_failed', 'payment_intent.canceled']:
            payment_intent = event['data']['object']
            pi_id = payment_intent['id']
            order_id = payment_intent.get('metadata', {}).get('order_id')
            
            order = None
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                except Order.DoesNotExist:
                    pass
            
            if not order:
                order = Order.objects.filter(payment_intent_id=pi_id).first()

            if order:
                if order.status not in ['Paid', 'Failed']:
                    from django.db import transaction
                    with transaction.atomic():
                        for item in order.items.all():
                            try:
                                product = Product.objects.select_for_update().get(id=item.product_id)
                                product.stock += item.quantity
                                product.save()
                                transaction_logger.info(
                                    f"Restored stock for product {product.id} by {item.quantity}",
                                    extra={'context': {'order_id': str(order.id), 'product_id': product.id, 'restored_qty': item.quantity, 'new_stock': product.stock}}
                                )
                            except Product.DoesNotExist:
                                transaction_logger.error(
                                    f"Product {item.product_id} not found during stock restoration for order {order.id}",
                                    extra={'context': {'order_id': str(order.id), 'product_id': item.product_id}}
                                )
                        
                        order.status = 'Failed'
                        order.save()
                        transaction_logger.warning(
                            f"Order {order.id} marked as Failed due to payment failure/cancellation",
                            extra={'context': {'order_id': str(order.id), 'payment_intent_id': pi_id, 'status': 'Failed'}}
                        )
            else:
                transaction_logger.warning(
                    f"Order not found for failed/canceled PaymentIntent {pi_id}",
                    extra={'context': {'payment_intent_id': pi_id}}
                )

        return HttpResponse("Success", status=200)
