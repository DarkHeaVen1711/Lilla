import uuid
from django.db import models
from django.core.cache import cache

class SyncableModel(models.Model):
    is_synced = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Category(SyncableModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    image = models.CharField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"


class Product(SyncableModel):
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

    # Timestamp for newest sort
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
        ]


class Combo(SyncableModel):
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





class Coupon(SyncableModel):
    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2)  # e.g., 20.00 for 20%
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} ({self.discount_percentage}%)"


from django.contrib.auth.models import User

class Order(SyncableModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    user_identifier = models.CharField(max_length=255, db_index=True)  # email or phone number
    shipping_name = models.CharField(max_length=255)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=255)
    shipping_postal_code = models.CharField(max_length=50)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    coupon_code = models.CharField(max_length=50, blank=True, null=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=50, default="Pending", db_index=True)  # Pending, Paid, Failed
    payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    currency = models.CharField(max_length=10, default="USD")
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Tracking / Shipment Fields
    carrier_name = models.CharField(max_length=100, blank=True, null=True, default="DHL Express")
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    estimated_delivery_date = models.DateField(blank=True, null=True)
    shipment_status = models.CharField(max_length=50, default="Placed", db_index=True)  # Placed, Processed, Shipped, Out for Delivery, Delivered

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_status = self.status

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            import uuid
            self.tracking_number = f"LILLA-US-{uuid.uuid4().hex[:8].upper()}"
        if not self.estimated_delivery_date:
            from datetime import timedelta, date
            self.estimated_delivery_date = date.today() + timedelta(days=4)
        super().save(*args, **kwargs)
        self._original_status = self.status

    def __str__(self):
        return f"Order {self.id} ({self.user_identifier})"


class OrderItem(SyncableModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product_id = models.CharField(max_length=100)
    product_name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()

    def __str__(self):
        return f"{self.quantity} x {self.product_name} in Order {self.order.id}"


class StockAdjustment(SyncableModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_adjustments")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    old_stock = models.IntegerField()
    new_stock = models.IntegerField()
    reason = models.CharField(max_length=255, default="Admin Manual Edit")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"StockAdjustment {self.product.name}: {self.old_stock} -> {self.new_stock} by {self.user}"


class Favorite(SyncableModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.username} favorited {self.product.name}"


class Address(SyncableModel):
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


class Review(SyncableModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="product_reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_reviews")
    rating = models.PositiveIntegerField()
    comment = models.TextField(blank=True)
    helpful_votes = models.PositiveIntegerField(default=0)
    images = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'user')

    def __str__(self):
        return f"Review for {self.product.name} by {self.user.username} ({self.rating} stars)"


class ReviewHelpfulVote(SyncableModel):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="helpful_voters")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="helpful_reviews")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('review', 'user')

    def __str__(self):
        return f"{self.user.username} voted helpful on review {self.review.id}"


from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg

@receiver(post_save, sender=Review)
@receiver(post_delete, sender=Review)
def update_product_rating_metrics(sender, instance, **kwargs):
    product = instance.product
    reviews_qs = product.product_reviews.all()
    count = reviews_qs.count()
    if count > 0:
        avg_rating = reviews_qs.aggregate(Avg('rating'))['rating__avg']
        product.rating = round(avg_rating, 2)
    else:
        product.rating = 4.80
    product.reviews = count
    product.save()

from django.db.models.signals import pre_save

@receiver(pre_save)
def set_unsynced_offline(sender, instance, **kwargs):
    if isinstance(instance, SyncableModel):
        if not cache.get('is_online', True):
            instance.is_synced = False

