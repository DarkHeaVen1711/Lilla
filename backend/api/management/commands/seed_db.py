from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from api.models import Category, Product, Combo

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
                "image": "/images/Red_Pore.png",
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
            },
            {
                "id": "centella-ampoule",
                "slug": "centella-ampoule",
                "name": "Centella Ampoule",
                "description": "Soothing centella ampoule to calm sensitive skin barrier and hydrate skin cells.",
                "image": "/images/centella_ampoule.png",
                "price": 75,
                "original_price": 90,
                "rating": 4.9,
                "reviews": 142,
                "category_slug": "daily-essentials",
                "featured": True,
                "skin_concerns": ["Irritation", "Redness"],
                "key_ingredients": ["Centella Asiatica Extract 100%"]
            },
            {
                "id": "hyaluronic-acid-serum",
                "slug": "hyaluronic-acid-serum",
                "name": "Hyaluronic Acid Serum",
                "description": "Ultra-hydrating hyaluronic acid serum for deep cellular moisture replenishment.",
                "image": "/images/hyaluronic_acid_serum.png",
                "price": 65,
                "rating": 4.8,
                "reviews": 98,
                "category_slug": "daily-essentials",
                "featured": True,
                "skin_concerns": ["Dehydration", "Dryness"],
                "key_ingredients": ["Hyaluronic Acid Complex"]
            },
            {
                "id": "cica-soothing-cream",
                "slug": "cica-soothing-cream",
                "name": "Cica Soothing Cream",
                "description": "Calming cica cream to soothe dry irritated skin and strengthen moisture barrier.",
                "image": "/images/cica_soothing_cream.png",
                "price": 80,
                "original_price": 95,
                "rating": 4.7,
                "reviews": 62,
                "category_slug": "daily-essentials",
                "featured": False,
                "skin_concerns": ["Dryness", "Barrier repair"],
                "key_ingredients": ["Cica Extract", "Ceramides"]
            },
            {
                "id": "mugwort-wash-off-pack",
                "slug": "mugwort-wash-off-pack",
                "name": "Mugwort Wash Off Pack",
                "description": "Wash-off mask packed with real mugwort powder to soothe and clear skin complexion.",
                "image": "/images/mugwort_mask.png",
                "price": 110,
                "original_price": 130,
                "rating": 4.9,
                "reviews": 85,
                "category_slug": "treatments-mask",
                "featured": True,
                "skin_concerns": ["Acne", "Redness"],
                "key_ingredients": ["Mugwort Powder", "Kaolin"]
            },
            {
                "id": "aha-bha-exfoliating-toner",
                "slug": "aha-bha-exfoliating-toner",
                "name": "AHA BHA Exfoliating Toner",
                "description": "Exfoliating toner formulated with AHA and BHA to smooth skin texture and clear pores.",
                "image": "/images/aha_bha_toner.png",
                "price": 70,
                "rating": 4.6,
                "reviews": 73,
                "category_slug": "daily-essentials",
                "featured": False,
                "skin_concerns": ["Textures", "Pores"],
                "key_ingredients": ["Glycolic Acid", "Salicylic Acid"]
            },
            {
                "id": "green-tea-seed-oil",
                "slug": "green-tea-seed-oil",
                "name": "Green Tea Seed Oil",
                "description": "Lightweight green tea seed oil providing deep nourishment and antioxidant care.",
                "image": "/images/green_tea_oil.png",
                "price": 95,
                "original_price": 115,
                "rating": 4.8,
                "reviews": 51,
                "category_slug": "daily-essentials",
                "featured": False,
                "skin_concerns": ["Dullness", "Dryness"],
                "key_ingredients": ["Green Tea Seed Extract", "Tocopherol"]
            },
            {
                "id": "snail-mucin-essence",
                "slug": "snail-mucin-essence",
                "name": "Snail Mucin Essence",
                "description": "Snail mucin power essence to hydrate, soothe, and repair damaged skin barrier.",
                "image": "/images/snail_mucin_essence.png",
                "price": 88,
                "rating": 4.9,
                "reviews": 245,
                "category_slug": "daily-essentials",
                "featured": True,
                "skin_concerns": ["Barrier repair", "Acne scars"],
                "key_ingredients": ["Snail Secretion Filtrate 96%"]
            },
            {
                "id": "matte-liquid-lipstick",
                "slug": "matte-liquid-lipstick",
                "name": "Matte Liquid Lipstick",
                "description": "Highly pigmented matte liquid lipstick for all-day smudge-proof coverage.",
                "image": "/images/matte_lipstick.png",
                "price": 38,
                "original_price": 45,
                "rating": 4.7,
                "reviews": 168,
                "category_slug": "color-cosmetics",
                "featured": True,
                "finish": "Matte",
                "shades": [{"name": "Crimson Red", "hex": "#8B0000"}, {"name": "Nude Velvet", "hex": "#BC8F8F"}]
            },
            {
                "id": "dewy-cushion-foundation",
                "slug": "dewy-cushion-foundation",
                "name": "Dewy Cushion Foundation",
                "description": "Dewy cushion foundation that offers buildable light-to-medium coverage for a glassy finish.",
                "image": "/images/cushion_foundation.png",
                "price": 115,
                "rating": 4.8,
                "reviews": 76,
                "category_slug": "face-makeup",
                "featured": False,
                "finish": "Dewy"
            },
            {
                "id": "vitamin-e-nourishing-mask",
                "slug": "vitamin-e-nourishing-mask",
                "name": "Vitamin E Nourishing Mask",
                "description": "Nourishing sheet mask infused with vitamin E to revitalize tired dull skin.",
                "image": "/images/vitamin_e_mask.png",
                "price": 90,
                "original_price": 110,
                "rating": 4.6,
                "reviews": 54,
                "category_slug": "treatments-mask",
                "featured": False,
                "skin_concerns": ["Dullness", "Anti-aging"],
                "key_ingredients": ["Vitamin E", "Ceramides"]
            },
            {
                "id": "glow-primer-spray",
                "slug": "glow-primer-spray",
                "name": "Glow Primer Spray",
                "description": "Preps the skin with a luminous base spray to extend makeup wear time.",
                "image": "/images/glow_primer_spray.png",
                "price": 55,
                "rating": 4.7,
                "reviews": 92,
                "category_slug": "face-makeup",
                "featured": False,
                "finish": "Luminous"
            },
            {
                "id": "velvet-lip-tint",
                "slug": "velvet-lip-tint",
                "name": "Velvet Lip Tint",
                "description": "Soft velvet lip tint with airy texture and blur finish for daily wear.",
                "image": "/images/velvet_lip_tint.png",
                "price": 35,
                "original_price": 40,
                "rating": 4.9,
                "reviews": 184,
                "category_slug": "color-cosmetics",
                "featured": True,
                "finish": "Velvet",
                "shades": [{"name": "Peach Coral", "hex": "#FF7F50"}, {"name": "Rose Wood", "hex": "#CD5C5C"}]
            },
            {
                "id": "rosewater-hydration-mist",
                "slug": "rosewater-hydration-mist",
                "name": "Rosewater Hydration Mist",
                "description": "Soothing rosewater mist providing instant hydration and refreshment for dry skin.",
                "image": "/images/rosewater_mist.png",
                "price": 40,
                "rating": 4.8,
                "reviews": 82,
                "category_slug": "daily-essentials",
                "featured": False,
                "skin_concerns": ["Dryness", "Dullness"],
                "key_ingredients": ["Organic Rosewater", "Glycerin"]
            },
            {
                "id": "clay-pore-purifying-mask",
                "slug": "clay-pore-purifying-mask",
                "name": "Clay Pore Purifying Mask",
                "description": "Deep cleansing clay mask designed to remove oil and purify clogged pore channels.",
                "image": "/images/clay_pore_mask.png",
                "price": 100,
                "original_price": 120,
                "rating": 4.7,
                "reviews": 94,
                "category_slug": "treatments-mask",
                "featured": False,
                "skin_concerns": ["Pores", "Sebum control"],
                "key_ingredients": ["Bentonite Clay", "Charcoal Powder"]
            },
            {
                "id": "retinol-night-cream",
                "slug": "retinol-night-cream",
                "name": "Retinol Night Cream",
                "description": "Anti-aging retinol night cream to reduce wrinkles, boost collagen, and smooth skin texture.",
                "image": "/images/vitaminc.png",
                "price": 135,
                "original_price": 160,
                "rating": 4.9,
                "reviews": 118,
                "category_slug": "daily-essentials",
                "featured": True,
                "skin_concerns": ["Anti-aging", "Textures"],
                "key_ingredients": ["Retinol 0.1%", "Adenosine"]
            },
            {
                "id": "nourishing-body-wash",
                "slug": "nourishing-body-wash",
                "name": "Nourishing Body Wash",
                "description": "Calming body wash with botanical extracts for deep hydration and clean feeling skin.",
                "image": "/images/ChatGPT Image May 14, 2026, 05_37_45 PM 1.png",
                "price": 60,
                "rating": 4.8,
                "reviews": 48,
                "category_slug": "daily-essentials",
                "featured": False
            },
            {
                "id": "revitalizing-body-lotion",
                "slug": "revitalizing-body-lotion",
                "name": "Revitalizing Body Lotion",
                "description": "Moisture locking body lotion with nourishing lipids for sensitive skin barriers.",
                "image": "/images/ChatGPT Image May 14, 2026, 05_37_45 PM 1.png",
                "price": 70,
                "original_price": 85,
                "rating": 4.7,
                "reviews": 53,
                "category_slug": "daily-essentials",
                "featured": False
            },
            {
                "id": "satin-finish-blush",
                "slug": "satin-finish-blush",
                "name": "Satin Finish Blush",
                "description": "Weightless powder blush that delivers a natural flush with a soft satin finish.",
                "image": "/images/youmightlike_blush.png",
                "price": 48,
                "rating": 4.8,
                "reviews": 86,
                "category_slug": "color-cosmetics",
                "featured": False,
                "finish": "Satin"
            },
            {
                "id": "waterproof-mascara",
                "slug": "waterproof-mascara",
                "name": "Waterproof Mascara",
                "description": "Volumizing waterproof mascara that lasts all day without flaking or smudging.",
                "image": "/images/makeup_hover_5.png",
                "price": 32,
                "original_price": 40,
                "rating": 4.7,
                "reviews": 104,
                "category_slug": "color-cosmetics",
                "featured": False,
                "finish": "Waterproof"
            },
            {
                "id": "under-eye-brightening-cream",
                "slug": "under-eye-brightening-cream",
                "name": "Under-eye Brightening Cream",
                "description": "Nourishing eye cream to reduce dark circles, smooth fine lines, and puffiness.",
                "image": "/images/vitaminc.png",
                "price": 68,
                "rating": 4.9,
                "reviews": 112,
                "category_slug": "daily-essentials",
                "featured": True,
                "skin_concerns": ["Dullness", "Anti-aging"],
                "key_ingredients": ["Caffeine", "Peptides"]
            }
        ]

        now = timezone.now()
        for p_data in products_data:
            cat_slug = p_data.pop("category_slug")
            cat = categories_by_slug.get(cat_slug)
            
            # Add premium skincare defaults
            ingredients = "Water, Glycerin, Butylene Glycol, Caprylic/Capric Triglyceride, 1,2-Hexanediol, Niacinamide."
            steps = ["Cleanse skin thoroughly.", "Apply moderate amount evenly.", "Gently pat for absorption."]
            skin_types = ["Dry", "Normal", "Sensitive"]
            
            # Enrich specific products with premium skincare details
            if p_data["id"] == "red-bean-refreshing-pore-mask":
                ingredients = "Red Bean Extract 30%, Kaolin Clay, Glycerin, Water, Butylene Glycol."
                steps = ["Wash face.", "Apply evenly avoiding eyes.", "Leave for 10-15 minutes.", "Wash with warm water."]
                skin_types = ["Oily", "Combination"]
            elif p_data["id"] == "radiance-pink-serum":
                ingredients = "Pink Pearl Extract, Niacinamide, Hyaluronic Acid, Water, Glycerin."
                steps = ["After toner, apply 2-3 drops.", "Smooth over face and neck.", "Pat gently."]
                skin_types = ["Dull", "Dry", "Combination"]
            
            # Setup Deal of the Day for specific product
            is_deal = False
            deal_expiry = None
            if p_data["id"] == "red-bean-refreshing-pore-mask":
                is_deal = True
                deal_expiry = now + timedelta(days=1)
                
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
                    "shades": p_data.get("shades", []),
                    # Skincare fields
                    "ingredients": ingredients,
                    "application_steps": steps,
                    "skin_types": skin_types,
                    # Promotional fields
                    "is_deal_of_the_day": is_deal,
                    "deal_expires_at": deal_expiry,
                    "is_active": True
                }
            )
            if created:
                self.stdout.write(f'Created Product: {p.name}')

        # 3. Create Combos
        self.stdout.write('Seeding combos...')
        
        combos_data = [
            {
                "name": "Skincare Glow Combo",
                "slug": "skincare-glow-combo",
                "description": "Double formulation to clear pores and hydrate skin for an active, bright look.",
                "image": "/images/magnific_create-a-premium-lilaa-hy_2981158217 1.png",
                "bundle_price": 200.00,
                "is_active": True,
                "is_promotional": True,
                "product_ids": ["red-bean-refreshing-pore-mask", "radiance-pink-serum"]
            },
            {
                "name": "Satin Glow Makeup Combo",
                "slug": "satin-glow-makeup-combo",
                "description": "High gloss lips and satin flush cheeks to give a premium dewy finish.",
                "image": "/images/ChatGPT Image May 14, 2026, 05_32_30 PM 1.png",
                "bundle_price": 75.00,
                "is_active": True,
                "is_promotional": True,
                "product_ids": ["lip-gloss", "satin-finish-blush"]
            }
        ]

        for combo_data in combos_data:
            p_ids = combo_data.pop("product_ids")
            combo, created = Combo.objects.update_or_create(
                slug=combo_data["slug"],
                defaults={
                    "name": combo_data["name"],
                    "description": combo_data["description"],
                    "image": combo_data["image"],
                    "bundle_price": combo_data["bundle_price"],
                    "is_active": combo_data["is_active"],
                    "is_promotional": combo_data["is_promotional"]
                }
            )
            combo.products.clear()
            for pid in p_ids:
                try:
                    product = Product.objects.get(id=pid)
                    combo.products.add(product)
                except Product.DoesNotExist:
                    pass
            combo.save()
            if created:
                self.stdout.write(f'Created Combo: {combo.name}')

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))
