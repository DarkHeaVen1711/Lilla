from django.contrib import admin
from .models import Category, Product, Combo, Order, OrderItem, StockAdjustment, Coupon, Review, UserProfile
 
class LowStockFilter(admin.SimpleListFilter):
    title = 'stock status'
    parameter_name = 'stock_status'
 
    def lookups(self, request, model_admin):
        return (
            ('low_stock', 'Low Stock (< 10)'),
            ('out_of_stock', 'Out of Stock (0)'),
            ('in_stock', 'In Stock (>= 10)'),
        )
 
    def queryset(self, request, queryset):
        if self.value() == 'low_stock':
            return queryset.filter(stock__lt=10, stock__gt=0)
        if self.value() == 'out_of_stock':
            return queryset.filter(stock=0)
        if self.value() == 'in_stock':
            return queryset.filter(stock__gte=10)
        return queryset
 
 
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
 
 
class ComboAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'bundle_price', 'is_active', 'is_promotional')
    list_filter = ('is_active', 'is_promotional')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ('products',)
 
 
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_id', 'product_name', 'price', 'quantity')
 
 
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_identifier', 'status', 'shipment_status', 'carrier_name', 'tracking_number', 'estimated_delivery_date', 'total_price', 'created_at')
    list_filter = ('status', 'shipment_status', 'created_at')
    search_fields = ('user_identifier', 'id', 'tracking_number')
    readonly_fields = ('id', 'created_at')
    inlines = [OrderItemInline]
 
 
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'user', 'old_stock', 'new_stock', 'reason', 'created_at')
    list_filter = ('created_at', 'reason')
    search_fields = ('product__name', 'user__username')
    readonly_fields = ('product', 'user', 'old_stock', 'new_stock', 'reason', 'created_at')
 
 
class StockAdjustmentInline(admin.TabularInline):
    model = StockAdjustment
    extra = 0
    readonly_fields = ('user', 'old_stock', 'new_stock', 'reason', 'created_at')
    can_delete = False
 
    def has_add_permission(self, request, obj=None):
        return False
 
 
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'price', 'stock', 'is_active', 'is_deal_of_the_day')
    list_filter = ('is_active', 'is_deal_of_the_day', LowStockFilter)
    search_fields = ('name', 'id', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [StockAdjustmentInline]
 
    def save_model(self, request, obj, form, change):
        old_stock = 0
        if change:
            try:
                old_stock = Product.objects.get(pk=obj.pk).stock
            except Product.DoesNotExist:
                pass
 
        is_stock_changed = not change or old_stock != obj.stock
 
        super().save_model(request, obj, form, change)
 
        if is_stock_changed:
            StockAdjustment.objects.create(
                product=obj,
                user=request.user,
                old_stock=old_stock if change else 0,
                new_stock=obj.stock,
                reason="Admin Manual Edit" if change else "Product Creation Stock Initialized"
            )


class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percentage', 'is_active', 'expires_at', 'created_at')
    list_filter = ('is_active', 'expires_at', 'created_at')
    search_fields = ('code',)
 
 
admin.site.register(Category, CategoryAdmin)
admin.site.register(Combo, ComboAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(StockAdjustment, StockAdjustmentAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(Coupon, CouponAdmin)


class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__name', 'user__username', 'comment')


admin.site.register(Review, ReviewAdmin)


class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('user',)


admin.site.register(UserProfile, UserProfileAdmin)
