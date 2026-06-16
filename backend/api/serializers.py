from rest_framework import serializers
from .models import Category, Product, Order, OrderItem, Combo

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
        fields = ['id', 'user', 'user_identifier', 'shipping_name', 'shipping_address', 'shipping_city', 'shipping_postal_code', 'total_price', 'status', 'created_at', 'items']
        read_only_fields = ['id', 'user', 'status', 'created_at']

    def validate(self, attrs):
        items = attrs.get('items', [])
        if not items:
            raise serializers.ValidationError("Order must contain at least one item.")

        calculated_subtotal = decimal.Decimal('0.00')
        from .models import Product
        for item in items:
            product_id = item.get('product_id')
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product with ID '{product_id}' does not exist.")

            db_price = product.price
            submitted_price = item.get('price')
            if db_price != submitted_price:
                raise serializers.ValidationError(
                    f"Price mismatch for product '{product.name}'. Submitted: {submitted_price}, DB: {db_price}."
                )

            quantity = item.get('quantity')
            if quantity <= 0:
                raise serializers.ValidationError("Quantity must be greater than zero.")

            calculated_subtotal += db_price * quantity

        # total = subtotal - 20% discount + 15.00 delivery
        discount = calculated_subtotal * decimal.Decimal('0.20')
        delivery_fee = decimal.Decimal('15.00')
        calculated_total = calculated_subtotal - discount + delivery_fee
        
        submitted_total = attrs.get('total_price')
        if abs(submitted_total - calculated_total) > decimal.Decimal('0.05'):
            raise serializers.ValidationError(
                f"Total price mismatch. Calculated: {calculated_total}, Submitted: {submitted_total}."
            )

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order
