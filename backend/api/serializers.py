import logging
from django.db import transaction
from rest_framework import serializers
from .models import Category, Product, Order, OrderItem, Combo, Favorite, Address, Review

transaction_logger = logging.getLogger('lilla.transaction')

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class NestedProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class CategoryWithProductsSerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'products']

    def get_products(self, obj):
        # Accesses cached prefetched products if prefetch_related was run, avoiding N+1 queries.
        return NestedProductSerializer(obj.products.all(), many=True, context=self.context).data


class ComboSerializer(serializers.ModelSerializer):
    products = NestedProductSerializer(many=True, read_only=True)

    class Meta:
        model = Combo
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product_id', 'product_name', 'price', 'quantity']


import decimal

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'user_identifier', 'shipping_name', 'shipping_address', 'shipping_city', 'shipping_postal_code', 'total_price', 'status', 'created_at', 'items', 'coupon_code', 'discount_amount', 'currency']
        read_only_fields = ['id', 'user', 'status', 'created_at', 'discount_amount']

    def validate(self, attrs):
        items = attrs.get('items', [])
        if not items:
            raise serializers.ValidationError("Order must contain at least one item.")

        from .views import get_exchange_rates
        rates = get_exchange_rates()
        currency = attrs.get('currency', 'USD')
        rate = decimal.Decimal(str(rates.get(currency, 1.0)))

        calculated_subtotal = decimal.Decimal('0.00')
        from .models import Product
        for item in items:
            product_id = item.get('product_id')
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product with ID '{product_id}' does not exist.")

            expected_price = (product.price * rate).quantize(decimal.Decimal('0.01'))
            submitted_price = item.get('price')
            if abs(expected_price - submitted_price) > decimal.Decimal('0.05'):
                raise serializers.ValidationError(
                    f"Price mismatch for product '{product.name}'. Submitted: {submitted_price}, Expected: {expected_price} ({currency})."
                )

            quantity = item.get('quantity')
            if quantity <= 0:
                raise serializers.ValidationError("Quantity must be greater than zero.")

            calculated_subtotal += expected_price * quantity

        # Validate Coupon
        coupon_code = attrs.get('coupon_code')
        discount_percentage = decimal.Decimal('0.00')
        if coupon_code:
            from .models import Coupon
            from django.utils import timezone
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code.strip())
                if not coupon.is_active:
                    raise serializers.ValidationError({"coupon_code": "Coupon is inactive."})
                if coupon.expires_at and coupon.expires_at < timezone.now():
                    raise serializers.ValidationError({"coupon_code": "Coupon has expired."})
                discount_percentage = coupon.discount_percentage
            except Coupon.DoesNotExist:
                raise serializers.ValidationError({"coupon_code": "Invalid coupon code."})

        # Calculate discount
        discount = calculated_subtotal * (discount_percentage / decimal.Decimal('100.00'))
        discount = discount.quantize(decimal.Decimal('0.01'))
        
        # Delivery fee in submitted currency (15.00 base USD)
        delivery_fee = (decimal.Decimal('15.00') * rate).quantize(decimal.Decimal('0.01'))
        
        # Free delivery threshold is $100 equivalent
        subtotal_in_usd = calculated_subtotal / rate
        if subtotal_in_usd > decimal.Decimal('100.00'):
            delivery_fee = decimal.Decimal('0.00')

        calculated_total = calculated_subtotal - discount + delivery_fee
        
        submitted_total = attrs.get('total_price')
        if abs(submitted_total - calculated_total) > decimal.Decimal('0.05'):
            raise serializers.ValidationError(
                f"Total price mismatch. Calculated: {calculated_total}, Submitted: {submitted_total} ({currency})."
            )

        # Save calculations into validated data
        attrs['discount_amount'] = discount
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Lock products and check/deduct stock first
        for item_data in items_data:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity')
            
            # Row-level locking to prevent checkout race conditions
            try:
                product = Product.objects.select_for_update().get(id=product_id)
                transaction_logger.info(
                    f"Database row-lock acquired for product: {product_id}",
                    extra={'context': {'product_id': product_id, 'status': 'acquired', 'requested_qty': quantity, 'available_stock': product.stock}}
                )
            except Product.DoesNotExist:
                transaction_logger.error(
                    f"Database row-lock failed: Product {product_id} does not exist",
                    extra={'context': {'product_id': product_id, 'status': 'failed_not_found', 'requested_qty': quantity}}
                )
                raise
            
            if product.stock < quantity:
                transaction_logger.warning(
                    f"Insufficient stock for product {product.name}",
                    extra={'context': {'product_id': product_id, 'status': 'insufficient_stock', 'available_stock': product.stock, 'requested_qty': quantity}}
                )
                raise serializers.ValidationError(
                    f"Insufficient stock for product '{product.name}'. Available: {product.stock}, Requested: {quantity}."
                )
            
            product.stock -= quantity
            product.save()
            
        # Create order and items
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
            
        transaction_logger.info(
            f"Checkout transaction completed successfully for order {order.id}",
            extra={'context': {'order_id': str(order.id), 'user_identifier': order.user_identifier, 'total_price': str(order.total_price)}}
        )
        return order


import re

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
PHONE_REGEX = re.compile(r'^\+?\d{3,15}$')

class OTPRequestSerializer(serializers.Serializer):
    identity = serializers.CharField(required=True)

    def validate_identity(self, value):
        value = value.strip()
        if '@' in value:
            if not EMAIL_REGEX.match(value):
                raise serializers.ValidationError("Invalid email address format.")
        else:
            cleaned_phone = re.sub(r'[\s()-]', '', value)
            if not PHONE_REGEX.match(cleaned_phone):
                raise serializers.ValidationError("Invalid phone number format.")
        return value


class OTPVerifySerializer(serializers.Serializer):
    identity = serializers.CharField(required=True)
    otp = serializers.CharField(required=True, min_length=6, max_length=6)

    def validate_otp(self, value):
        value = value.strip()
        if not value.isdigit():
            raise serializers.ValidationError("OTP must contain digits only.")
        return value


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = Favorite
        fields = ['id', 'product', 'product_id', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        user = self.context['request'].user
        product = attrs.get('product')
        if Favorite.objects.filter(user=user, product=product).exists():
            raise serializers.ValidationError("This product is already in your favorites.")
        return attrs


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'first_name', 'last_name', 'email', 'country', 'address', 'state', 'city', 'zip', 'phone', 'is_default', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['rating', 'comment']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be an integer between 1 and 5.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        product = self.context.get('product')
        user = request.user
        
        if Review.objects.filter(product=product, user=user).exists():
            raise serializers.ValidationError("You have already reviewed this product.")
        return attrs


class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    adjusted_by = serializers.CharField(source='user.username', read_only=True, default='System')

    class Meta:
        from .models import StockAdjustment
        model = StockAdjustment
        fields = ['id', 'product', 'product_name', 'old_stock', 'new_stock', 'reason', 'adjusted_by', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    phone = serializers.SerializerMethodField()

    class Meta:
        from django.contrib.auth.models import User
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'phone']
        read_only_fields = ['id', 'phone']

    def get_phone(self, obj):
        if '@' not in obj.username:
            return obj.username
        return ''

    def validate_email(self, value):
        from django.contrib.auth.models import User
        from django.db.models import Q
        user = self.context['request'].user
        value = value.strip().lower()
        if value:
            if User.objects.filter(Q(email__iexact=value) | Q(username__iexact=value)).exclude(id=user.id).exists():
                raise serializers.ValidationError("This email address is already in use.")
        return value

    def update(self, instance, validated_data):
        email = validated_data.get('email', '').strip().lower()
        old_username = instance.username

        if email and email != instance.email:
            instance.email = email
            if '@' in old_username:
                instance.username = email

        instance.first_name = validated_data.get('first_name', instance.first_name).strip()
        instance.last_name = validated_data.get('last_name', instance.last_name).strip()
        instance.save()
        return instance


