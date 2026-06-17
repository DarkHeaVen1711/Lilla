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
                
        # Match OrderSerializer validation formula: subtotal - 20% discount + 15.00 delivery fee
        discount = calculated_subtotal * decimal.Decimal('0.20')
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
