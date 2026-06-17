import uuid
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    image = models.CharField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"


class Product(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.CharField(max_length=500)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    discount = models.CharField(max_length=50, blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.8)
    reviews = models.IntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    featured = models.BooleanField(default=False)
    expires_on = models.CharField(max_length=50, default="28/12/2027")
    
    # Store dynamic metadata as JSON
    features_json = models.JSONField(default=list, blank=True)
    skin_concerns = models.JSONField(default=list, blank=True)
    key_ingredients = models.JSONField(default=list, blank=True)
    
    # Makeup specific fields
    finish = models.CharField(max_length=100, blank=True, null=True)
    applicator = models.CharField(max_length=100, blank=True, null=True)
    shades = models.JSONField(default=list, blank=True)

    # Premium skincare fields
    ingredients = models.TextField(blank=True, null=True)
    application_steps = models.JSONField(default=list, blank=True)
    skin_types = models.JSONField(default=list, blank=True)

    # Promotional fields
    is_deal_of_the_day = models.BooleanField(default=False)
    deal_expires_at = models.DateTimeField(blank=True, null=True)
    
    # Active state
    is_active = models.BooleanField(default=True)

    # Inventory stock
    stock = models.PositiveIntegerField(default=100)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
        ]


class Combo(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(blank=True)
    image = models.CharField(max_length=500, blank=True, null=True)
    products = models.ManyToManyField(Product, related_name="combos")
    bundle_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    is_promotional = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
        ]





from django.contrib.auth.models import User

class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    user_identifier = models.CharField(max_length=255, db_index=True)  # email or phone number
    shipping_name = models.CharField(max_length=255)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=255)
    shipping_postal_code = models.CharField(max_length=50)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, default="Pending", db_index=True)  # Pending, Paid, Failed
    payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} ({self.user_identifier})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product_id = models.CharField(max_length=100)
    product_name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()

    def __str__(self):
        return f"{self.quantity} x {self.product_name} in Order {self.order.id}"


class StockAdjustment(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_adjustments")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    old_stock = models.IntegerField()
    new_stock = models.IntegerField()
    reason = models.CharField(max_length=255, default="Admin Manual Edit")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"StockAdjustment {self.product.name}: {self.old_stock} -> {self.new_stock} by {self.user}"


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} favorited {self.product.name}"


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField()
    country = models.CharField(max_length=100, default="US")
    address = models.TextField()
    state = models.CharField(max_length=100)
    city = models.CharField(max_length=255)
    zip = models.CharField(max_length=50)
    phone = models.CharField(max_length=50)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.address}"

