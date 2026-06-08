from django.core.management.base import BaseCommand
from api.models import Category, Product

class Command(BaseCommand):
    help = 'Seeds categories and products into the database'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # 1. Create Categories
        categories_data = [
            { "name": "Treatments & Mask", "slug": "treatments-mask", "image": "/images/treatment.png" },
            { "name": "Daily Essentials", "slug": "daily-essentials", "image": "/images/daily.png" },
            { "name": "Color Cosmetics", "slug": "color-cosmetics", "image": "/images/colorcosmetics.png" },
            { "name": "Face Makeup", "slug": "face-makeup", "image": "/images/facemakeup.png" }
        ]

        categories_by_slug = {}
        for cat_data in categories_data:
            cat, created = Category.objects.update_or_create(
                slug=cat_data["slug"],
                defaults={
                    "name": cat_data["name"],
                    "image": cat_data["image"]
                }
            )
            categories_by_slug[cat_data["slug"]] = cat
            if created:
                self.stdout.write(f'Created Category: {cat.name}')

        # 2. Create Products
        products_data = [
            {
                "id": "red-bean-refreshing-pore-mask",
                "slug": "red-bean-refreshing-pore-mask",
                "name": "Red Bean Refreshing pore mask",
                "description": "Beauty of Joseon Red Bean Mask with 30% red bean and kaolin washes away excess sebum. exfoliates for bright, clean, and refreshed skin.",
                "image": "/images/Photo.png",
                "price": 120,
                "original_price": 150,
                "rating": 4.8,
                "reviews": 108,
                "category_slug": "treatments-mask",
                "featured": True,
                "expires_on": "28/12/2027",
                "skin_concerns": ["Pore tightening", "Sebum control"],
                "key_ingredients": ["Red Bean Extract 30%", "Kaolin Clay"],
                "features_json": [
                    {
                        "badge": "Pores",
                        "title": "Sebum Absorption",
                        "description": "Kaolin clay draws out deep-rooted impurities and oil.",
                        "x1": 20, "y1": 26, "x2": 45, "y2": 35
                    },
                    {
                        "badge": "Exfoliation",
                        "title": "Red Bean Scrub",
                        "description": "Mild red bean powder particles gently buff away dead cells.",
                        "x1": 32, "y1": 80, "x2": 48, "y2": 65
                    },
                    {
                        "badge": "Soothing",
                        "title": "Cooling Texture",
                        "description": "Soft clay formula provides refreshing hydration to skin.",
                        "x1": 80, "y1": 36, "x2": 56, "y2": 48
                    }
                ]
            },
            {
                "id": "radiance-pink-serum",
                "slug": "radiance-pink-serum",
                "name": "Radiance Pink Serum",
                "description": "Hydrating serum for a glowing, luminous complexion.",
                "image": "/images/Radiance Pink Serum.png",
                "price": 120,
                "original_price": 150,
                "discount": "-30%",
                "rating": 5.0,
                "reviews": 124,
                "category_slug": "daily-essentials",
                "featured": True,
                "expires_on": "28/12/2027",
                "skin_concerns": ["Dullness", "Dryness"],
                "key_ingredients": ["Pink Pearl Extract", "Niacinamide"],
                "features_json": [
                    {
                        "badge": "Glow",
                        "title": "Radiant Finish",
                        "description": "Leaves a soft pink pearl glow on the skin immediately.",
                        "x1": 20, "y1": 26, "x2": 45, "y2": 35
                    },
                    {
                        "badge": "Moisture",
                        "title": "Deep Hydration",
                        "description": "Infuses multi-weight hyaluronic acid into dry cells.",
                        "x1": 32, "y1": 80, "x2": 48, "y2": 65
                    },
                    {
                        "badge": "Barrier",
                        "title": "Niacinamide Boost",
                        "description": "Strengthens skin structure to resist pigmentation.",
                        "x1": 80, "y1": 36, "x2": 56, "y2": 48
                    }
                ]
            },
            {
                "id": "vitamin-c-cream",
                "slug": "vitamin-c-cream",
                "name": "Vitamin C",
                "description": "Brightening vitamin C cream for daily skin glow and protection.",
                "image": "/images/vitaminc.png",
                "price": 85,
                "rating": 4.8,
                "reviews": 89,
                "category_slug": "daily-essentials",
                "featured": True,
                "skin_concerns": ["Brightening", "Anti-aging"],
                "key_ingredients": ["Pure Vitamin C", "Adenosine"]
            },
            {
                "id": "lip-gloss",
                "slug": "lip-gloss",
                "name": "Lip Gloss",
                "description": "High-shine lip gloss with metallic tint and hydration.",
                "image": "/images/lip_gloss.png",
                "price": 45,
                "original_price": 50,
                "discount": "-10%",
                "rating": 4.9,
                "reviews": 210,
                "category_slug": "color-cosmetics",
                "featured": True,
                "finish": "High Gloss",
                "applicator": "Flocked Doe-foot",
                "shades": [
                    { "name": "Ruby Glow", "hex": "#9B2226" },
                    { "name": "Pink Shimmer", "hex": "#D46B7A" },
                    { "name": "Clear Glass", "hex": "#E9C46A" }
                ]
            },
            {
                "id": "floral-box",
                "slug": "floral-box",
                "name": "Floral Box",
                "description": "Exclusive floral packaging set containing lip tint and primer.",
                "image": "/images/floralbox.png",
                "price": 200,
                "rating": 5.0,
                "reviews": 56,
                "category_slug": "face-makeup",
                "featured": True
            },
            {
                "id": "floral-shampoo",
                "slug": "floral-shampoo",
                "name": "Floral Shampoo",
                "description": "Nourishing floral shampoo for shiny, healthy hair.",
                "image": "/images/floralshampoo.png",
                "price": 180,
                "original_price": 200,
                "discount": "-10%",
                "rating": 4.7,
                "reviews": 42,
                "category_slug": "daily-essentials",
                "featured": False
            },
            {
                "id": "floral-soap",
                "slug": "floral-soap",
                "name": "Floral Soap",
                "description": "Gentle cleansing soap with calming floral botanicals.",
                "image": "/images/floralsoap.png",
                "price": 90,
                "rating": 4.9,
                "reviews": 150,
                "category_slug": "daily-essentials",
                "featured": False
            },
            {
                "id": "ceo-afterglow-vitamin-c-serum",
                "slug": "ceo-afterglow-vitamin-c-serum",
                "name": "Ceo afterglow brightening vitamin C Serum",
                "description": "Limited-time brightening serum with vitamin C and anti-oxidants.",
                "image": "/images/ChatGPT Image May 14, 2026, 05_32_30 PM 1.png",
                "price": 120,
                "original_price": 150,
                "discount": "-30%",
                "category_slug": "daily-essentials",
                "featured": False,
                "skin_concerns": ["Acne scars", "Brightening"],
                "key_ingredients": ["THD Ascorbate", "Turmeric Extract"]
            },
            {
                "id": "radiance-pink-daily-serum",
                "slug": "radiance-pink-daily-serum",
                "name": "Radiance Pink Hydrating Daily Serum",
                "description": "Hydration-focused daily serum for radiant skin.",
                "image": "/images/ChatGPT Image May 14, 2026, 05_37_45 PM 1.png",
                "price": 85,
                "original_price": 100,
                "discount": "-15%",
                "category_slug": "daily-essentials",
                "featured": False,
                "skin_concerns": ["Dryness", "Dehydration"]
            },
            {
                "id": "soft-glam-facial-oil",
                "slug": "soft-glam-facial-oil",
                "name": "Soft Glam Nourishing Facial Oil",
                "description": "Nourishing facial oil for a smooth, glowing finish.",
                "image": "/images/magnific_create-a-premium-lilaa-hy_2981158217 1.png",
                "price": 90,
                "original_price": 120,
                "discount": "-25%",
                "category_slug": "daily-essentials",
                "featured": False
            },
            {
                "id": "hydration-ritual-set",
                "slug": "hydration-ritual-set",
                "name": "Hydration Ritual Set",
                "description": "A full hydration routine set built for dry skin barriers.",
                "image": "/images/magnific_create-a-premium-lilaa-hy_2981158217 1.png",
                "price": 120,
                "original_price": 150,
                "discount": "-30%",
                "rating": 5.0,
                "reviews": 124,
                "category_slug": "daily-essentials",
                "featured": False
            },
            {
                "id": "brightening-glow-set",
                "slug": "brightening-glow-set",
                "name": "Brightening & Glow Set",
                "description": "A complete brightening routine set for luminous tone.",
                "image": "/images/magnific_create-a-premium-lilaa-br_2981302769 1.png",
                "price": 85,
                "rating": 4.8,
                "reviews": 89,
                "category_slug": "daily-essentials",
                "featured": False
            },
            {
                "id": "soft-glam-makeup-set",
                "slug": "soft-glam-makeup-set",
                "name": "Soft Glam Makeup Set",
                "description": "Soft-focus makeup essentials including concealer and blush.",
                "image": "/images/ChatGPT Image May 14, 2026, 05_32_30 PM 1.png",
                "price": 45,
                "rating": 4.9,
                "reviews": 210,
                "category_slug": "face-makeup",
                "featured": False
            },
            {
                "id": "body-care-set",
                "slug": "body-care-set",
                "name": "Body Care Set",
                "description": "Body care wash and body lotion set for a calming ritual.",
                "image": "/images/ChatGPT Image May 14, 2026, 05_37_45 PM 1.png",
                "price": 200,
                "rating": 5.0,
                "reviews": 56,
                "category_slug": "daily-essentials",
                "featured": False
            }
        ]

        for p_data in products_data:
            cat_slug = p_data.pop("category_slug")
            cat = categories_by_slug.get(cat_slug)
            p, created = Product.objects.update_or_create(
                id=p_data["id"],
                defaults={
                    "slug": p_data["slug"],
                    "name": p_data["name"],
                    "description": p_data["description"],
                    "image": p_data["image"],
                    "price": p_data["price"],
                    "original_price": p_data.get("original_price"),
                    "discount": p_data.get("discount"),
                    "rating": p_data.get("rating", 4.8),
                    "reviews": p_data.get("reviews", 0),
                    "category": cat,
                    "featured": p_data.get("featured", False),
                    "expires_on": p_data.get("expires_on", "28/12/2027"),
                    "features_json": p_data.get("features_json", []),
                    "skin_concerns": p_data.get("skin_concerns", []),
                    "key_ingredients": p_data.get("key_ingredients", []),
                    "finish": p_data.get("finish"),
                    "applicator": p_data.get("applicator"),
                    "shades": p_data.get("shades", [])
                }
            )
            if created:
                self.stdout.write(f'Created Product: {p.name}')

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
