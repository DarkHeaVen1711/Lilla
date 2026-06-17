from django.contrib import admin
from .models import Category, Product, Combo, Order, OrderItem, StockAdjustment

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
    list_display = ('id', 'user_identifier', 'status', 'total_price', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user_identifier', 'id')
    readonly_fields = ('id', 'created_at')
    inlines = [OrderItemInline]


class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'user', 'old_stock', 'new_stock', 'reason', 'created_at')
    list_filter = ('created_at', 'reason')
    search_fields = ('product__name', 'user__username')
    readonly_fields = ('product', 'user', 'old_stock', 'new_stock', 'reason', 'created_at')


admin.site.register(Category, CategoryAdmin)
admin.site.register(Combo, ComboAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(StockAdjustment, StockAdjustmentAdmin)
