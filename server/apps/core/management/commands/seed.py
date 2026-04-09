"""
Populate the database with realistic pet product mock data.
Usage: python manage.py seed
"""

import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.brands.models import Brand, BrandTranslation
from apps.categories.models import Category, CategoryTranslation
from apps.products.models import (
    OptionType,
    OptionTypeTranslation,
    OptionValue,
    OptionValueTranslation,
    Product,
    ProductCategory,
    ProductImage,
    ProductTranslation,
    ProductVariant,
)

# ---------------------------------------------------------------------------
# Unsplash photo IDs — real pet product photography
# ---------------------------------------------------------------------------
DOG_FOOD_IMAGES = [
    "https://images.unsplash.com/photo-1589924749359-6852338c0795?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1585846416120-3a7354ed7d39?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1600628421066-89bd25aba544?w=800&h=800&fit=crop",
]

CAT_FOOD_IMAGES = [
    "https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800&h=800&fit=crop",
]

DOG_TOY_IMAGES = [
    "https://images.unsplash.com/photo-1535294435445-d7249b8f0eae?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1601758124096-1fd661873b48?w=800&h=800&fit=crop",
]

CAT_TOY_IMAGES = [
    "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=800&fit=crop",
]

DOG_BED_IMAGES = [
    "https://images.unsplash.com/photo-1541599468348-e603753c5043?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=800&fit=crop",
]

GROOMING_IMAGES = [
    "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1522276498395-f4f68f7f8571?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=800&fit=crop",
]

HEALTH_IMAGES = [
    "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1559190394-df5a28aab5c5?w=800&h=800&fit=crop",
]

COLLAR_IMAGES = [
    "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&h=800&fit=crop",
]

CATEGORY_IMAGES = {
    "dog-food": "https://images.unsplash.com/photo-1589924749359-6852338c0795?w=600&h=600&fit=crop",
    "cat-food": "https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=600&h=600&fit=crop",
    "dog-toys": "https://images.unsplash.com/photo-1535294435445-d7249b8f0eae?w=600&h=600&fit=crop",
    "cat-toys": "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=600&h=600&fit=crop",
    "beds-furniture": "https://images.unsplash.com/photo-1541599468348-e603753c5043?w=600&h=600&fit=crop",
    "grooming": "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&h=600&fit=crop",
    "health-wellness": "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=600&h=600&fit=crop",
    "collars-leads": "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=600&h=600&fit=crop",
    "treats-chews": "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600&h=600&fit=crop",
    "travel-outdoor": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=600&fit=crop",
}


# ---------------------------------------------------------------------------
# Data definitions
# ---------------------------------------------------------------------------
BRANDS_DATA = [
    {"name": "Forthglade", "desc": "Natural, grain-free recipes crafted in Devon since 1971."},
    {"name": "Lily's Kitchen", "desc": "Proper food made with natural ingredients your pet will love."},
    {"name": "Orijen", "desc": "Biologically appropriate food from fresh, regional ingredients."},
    {"name": "Canagan", "desc": "Premium British grain-free pet food for dogs and cats."},
    {"name": "Arden Grange", "desc": "Hypoallergenic pet food made in the heart of the English countryside."},
    {"name": "Pooch & Mutt", "desc": "Health-focused dog food and supplements backed by science."},
    {"name": "Catit", "desc": "Innovative products designed to enrich your cat's life."},
    {"name": "Kong", "desc": "The world's best-known dog toy, designed for enrichment and play."},
    {"name": "Ruffwear", "desc": "Performance dog gear for adventures on trail, water, and snow."},
    {"name": "Pets at Home Essentials", "desc": "Reliable everyday essentials for every pet owner."},
]

CATEGORIES_DATA = [
    {"name": "Dog Food", "slug": "dog-food", "desc": "Premium dry, wet, and raw food for dogs of all ages and breeds."},
    {"name": "Cat Food", "slug": "cat-food", "desc": "Nutritious meals and treats crafted for feline health."},
    {"name": "Dog Toys", "slug": "dog-toys", "desc": "Interactive and durable toys to keep your dog entertained."},
    {"name": "Cat Toys", "slug": "cat-toys", "desc": "Engaging toys that stimulate your cat's natural instincts."},
    {"name": "Beds & Furniture", "slug": "beds-furniture", "desc": "Comfortable beds, crates, and furniture for rest and relaxation."},
    {"name": "Grooming", "slug": "grooming", "desc": "Brushes, shampoos, and grooming tools for a healthy coat."},
    {"name": "Health & Wellness", "slug": "health-wellness", "desc": "Supplements, first aid, and wellness products for peak health."},
    {"name": "Collars & Leads", "slug": "collars-leads", "desc": "Stylish and secure collars, harnesses, and leads."},
    {"name": "Treats & Chews", "slug": "treats-chews", "desc": "Delicious natural treats and long-lasting chews."},
    {"name": "Travel & Outdoor", "slug": "travel-outdoor", "desc": "Carriers, travel bowls, and outdoor gear for adventures."},
]

IMAGE_MAP = {
    "dog-food": DOG_FOOD_IMAGES,
    "cat-food": CAT_FOOD_IMAGES,
    "dog-toys": DOG_TOY_IMAGES,
    "cat-toys": CAT_TOY_IMAGES,
    "beds-furniture": DOG_BED_IMAGES,
    "grooming": GROOMING_IMAGES,
    "health-wellness": HEALTH_IMAGES,
    "collars-leads": COLLAR_IMAGES,
    "treats-chews": DOG_FOOD_IMAGES,
    "travel-outdoor": GROOMING_IMAGES,
}


PRODUCTS_DATA = [
    # Dog Food
    {"name": "Forthglade Complete Grain-Free Chicken", "cat": "dog-food", "brand": "Forthglade", "short": "Natural grain-free chicken recipe with sweet potato and vegetables.", "desc": "<h3>Wholesome Nutrition</h3><p>Made with freshly prepared chicken and packed with natural goodness. This complete meal provides everything your dog needs for a happy, healthy life.</p><ul><li>60% freshly prepared chicken</li><li>Grain-free recipe</li><li>No artificial colours or flavours</li><li>Added joint supplements</li></ul>", "prices": [(1499, "2kg"), (2799, "6kg"), (4999, "12kg")], "featured": True, "rating": 4.7, "reviews": 234},
    {"name": "Orijen Original Dog Food", "cat": "dog-food", "brand": "Orijen", "short": "Biologically appropriate food with free-run chicken and turkey.", "desc": "<h3>Nature's Blueprint</h3><p>Loaded with 85% quality animal ingredients, Orijen nourishes dogs according to their natural dietary needs.</p><ul><li>85% animal ingredients</li><li>Fresh free-run chicken & turkey</li><li>Wild-caught fish</li><li>Freeze-dried liver coating</li></ul>", "prices": [(2499, "2kg"), (5499, "6kg"), (8999, "11.4kg")], "featured": True, "rating": 4.9, "reviews": 412},
    {"name": "Lily's Kitchen Sunday Lunch", "cat": "dog-food", "brand": "Lily's Kitchen", "short": "A proper Sunday roast for your four-legged friend.", "desc": "<h3>Sunday Lunch Every Day</h3><p>Slow-cooked chicken with roast vegetables and a hint of rosemary. It's the Sunday lunch your dog deserves, every day of the week.</p><ul><li>Freshly prepared chicken</li><li>Garden vegetables</li><li>Natural herbs</li><li>Complete and balanced</li></ul>", "prices": [(299, "150g tin"), (1199, "6-pack tins"), (2199, "12-pack tins")], "featured": False, "rating": 4.5, "reviews": 189},
    {"name": "Canagan Free-Run Chicken", "cat": "dog-food", "brand": "Canagan", "short": "Premium British grain-free kibble with 60% chicken.", "desc": "<h3>British Excellence</h3><p>Canagan's flagship recipe features free-run chicken sourced from trusted British farms. Slow-cooked for maximum digestibility.</p><ul><li>60% chicken content</li><li>Sweet potato & potato-free</li><li>Added probiotics</li><li>Small batch produced</li></ul>", "prices": [(1999, "2kg"), (3999, "6kg"), (6499, "12kg")], "featured": True, "rating": 4.6, "reviews": 167},
    {"name": "Arden Grange Adult Lamb & Rice", "cat": "dog-food", "brand": "Arden Grange", "short": "Hypoallergenic lamb recipe for sensitive stomachs.", "desc": "<h3>Gentle on Tummies</h3><p>Specially formulated for dogs with sensitive digestion. Made with fresh lamb and rice for optimal nutrient absorption.</p><ul><li>Hypoallergenic formula</li><li>Fresh lamb protein</li><li>Prebiotics for gut health</li><li>No artificial additives</li></ul>", "prices": [(1799, "2kg"), (3499, "6kg"), (5999, "12kg")], "featured": False, "rating": 4.4, "reviews": 98},
    {"name": "Pooch & Mutt Health & Digestion", "cat": "dog-food", "brand": "Pooch & Mutt", "short": "Vet-recommended superfood blend for digestive health.", "desc": "<h3>Science-Led Nutrition</h3><p>Developed with veterinary nutritionists, this recipe supports healthy digestion with prebiotics and superfoods.</p><ul><li>Turkey & sweet potato</li><li>Added chicory root prebiotics</li><li>Seaweed for dental health</li><li>Joint support complex</li></ul>", "prices": [(1599, "2kg"), (2999, "6kg"), (5499, "10kg")], "featured": False, "rating": 4.3, "reviews": 76},

    # Cat Food
    {"name": "Lily's Kitchen Fabulous Fish", "cat": "cat-food", "brand": "Lily's Kitchen", "short": "Grain-free fish feast with salmon, trout, and shrimp.", "desc": "<h3>Ocean Goodness</h3><p>A fabulous fish recipe that cats can't resist. Made with sustainably sourced salmon and white fish.</p><ul><li>65% fish content</li><li>Omega-3 for coat health</li><li>Grain and gluten free</li><li>No meat derivatives</li></ul>", "prices": [(1399, "800g"), (2499, "2kg"), (4499, "4kg")], "featured": True, "rating": 4.8, "reviews": 302},
    {"name": "Orijen Cat & Kitten", "cat": "cat-food", "brand": "Orijen", "short": "Protein-rich recipe with free-run chicken and whole fish.", "desc": "<h3>Feline Perfection</h3><p>Made with 90% quality animal ingredients to match your cat's natural diet. Rich in protein, low in carbohydrates.</p><ul><li>90% animal ingredients</li><li>Free-run chicken & turkey</li><li>Wild-caught mackerel</li><li>Freeze-dried liver infused</li></ul>", "prices": [(1999, "1.8kg"), (4499, "5.4kg")], "featured": True, "rating": 4.9, "reviews": 256},
    {"name": "Canagan Scottish Salmon", "cat": "cat-food", "brand": "Canagan", "short": "Premium grain-free salmon recipe for adult cats.", "desc": "<h3>Scottish Waters</h3><p>Freshly prepared Scottish salmon provides exceptional taste and nutrition. A firm favourite among discerning cats.</p><ul><li>65% salmon & fish</li><li>Grain-free formula</li><li>Cranberry for urinary health</li><li>Taurine enriched</li></ul>", "prices": [(1499, "1.5kg"), (3299, "4kg")], "featured": False, "rating": 4.6, "reviews": 143},

    # Dog Toys
    {"name": "Kong Classic Dog Toy", "cat": "dog-toys", "brand": "Kong", "short": "The gold standard of dog enrichment toys.", "desc": "<h3>Endless Entertainment</h3><p>The unpredictable bounce of the KONG Classic keeps dogs engaged for hours. Stuff with treats for an even more rewarding experience.</p><ul><li>Ultra-durable natural rubber</li><li>Unpredictable bounce</li><li>Stuffable for treats</li><li>Dishwasher safe</li></ul>", "prices": [(899, "Small"), (1099, "Medium"), (1399, "Large"), (1699, "X-Large")], "featured": True, "rating": 4.8, "reviews": 567},
    {"name": "Kong Extreme Ball", "cat": "dog-toys", "brand": "Kong", "short": "Ultra-tough ball for aggressive chewers.", "desc": "<h3>Built Tough</h3><p>Made from KONG's strongest natural rubber compound, designed for the most powerful chewers.</p><ul><li>Extreme durability</li><li>Erratic bounce for engagement</li><li>Floats in water</li><li>Multiple sizes available</li></ul>", "prices": [(799, "Small"), (999, "Medium"), (1199, "Large")], "featured": False, "rating": 4.6, "reviews": 234},
    {"name": "Ruffwear Huck-a-Cone Toy", "cat": "dog-toys", "brand": "Ruffwear", "short": "Durable fetch toy with erratic bounce pattern.", "desc": "<h3>Adventure Ready</h3><p>A tough, latex-free rubber toy designed for outdoor adventures. The unique shape creates an erratic bounce that dogs love.</p><ul><li>Natural rubber construction</li><li>Floats in water</li><li>High-visibility orange</li><li>Fits standard ball launchers</li></ul>", "prices": [(1499, "One Size")], "featured": False, "rating": 4.5, "reviews": 89},

    # Cat Toys
    {"name": "Catit Senses 2.0 Circuit", "cat": "cat-toys", "brand": "Catit", "short": "Interactive ball track that stimulates hunting instincts.", "desc": "<h3>Stimulate Natural Instincts</h3><p>The peek-a-boo track design with an illuminated ball engages your cat's senses of touch, sound, and sight.</p><ul><li>Customisable track layout</li><li>Illuminated motion ball</li><li>Combines with other Senses 2.0</li><li>Suitable for multi-cat homes</li></ul>", "prices": [(1499, "Standard")], "featured": True, "rating": 4.4, "reviews": 198},
    {"name": "Catit Flower Fountain", "cat": "cat-toys", "brand": "Catit", "short": "Fresh flowing water fountain encouraging hydration.", "desc": "<h3>Fresh Water Always</h3><p>The triple-action filter softens water, removes odours, and retains stray hairs. Three flow settings to suit fussy drinkers.</p><ul><li>3L capacity</li><li>Triple-action filter</li><li>3 water flow settings</li><li>Whisper-quiet pump</li></ul>", "prices": [(2499, "Standard"), (3499, "Stainless Steel")], "featured": True, "rating": 4.7, "reviews": 321},

    # Beds & Furniture
    {"name": "Luxury Orthopaedic Dog Bed", "cat": "beds-furniture", "brand": "Pets at Home Essentials", "short": "Memory foam bed for joint support and ultimate comfort.", "desc": "<h3>Restful Sleep</h3><p>Veterinary-grade memory foam cradles your dog's body, relieving pressure on joints and muscles. The bolstered sides provide a sense of security.</p><ul><li>10cm memory foam base</li><li>Removable, washable cover</li><li>Water-resistant lining</li><li>Non-slip base</li></ul>", "prices": [(4999, "Medium"), (6499, "Large"), (7999, "X-Large")], "featured": True, "rating": 4.7, "reviews": 156},
    {"name": "Cosy Cave Cat Bed", "cat": "beds-furniture", "brand": "Pets at Home Essentials", "short": "Enclosed cave-style bed for cats who love to hide.", "desc": "<h3>Hidden Retreat</h3><p>The enclosed design provides warmth and security that cats crave. Super-soft sherpa lining for maximum cosiness.</p><ul><li>Soft sherpa lining</li><li>Machine washable</li><li>Non-slip base</li><li>Multiple colours</li></ul>", "prices": [(2999, "Standard"), (3999, "Large")], "featured": False, "rating": 4.5, "reviews": 87},

    # Grooming
    {"name": "Professional Deshedding Tool", "cat": "grooming", "brand": "Pets at Home Essentials", "short": "Reduces shedding by up to 90% with regular use.", "desc": "<h3>Shed-Free Home</h3><p>The stainless steel deshedding edge reaches through the topcoat to safely remove loose undercoat hair without damaging the coat.</p><ul><li>Stainless steel edge</li><li>Ergonomic handle</li><li>FURejector button</li><li>Suitable for all coat types</li></ul>", "prices": [(1999, "Small"), (2499, "Medium"), (2999, "Large")], "featured": False, "rating": 4.3, "reviews": 145},
    {"name": "Oatmeal & Aloe Shampoo", "cat": "grooming", "brand": "Pets at Home Essentials", "short": "Gentle, soap-free formula for sensitive skin.", "desc": "<h3>Gentle Cleansing</h3><p>Colloidal oatmeal soothes itchy, dry skin while aloe vera moisturises. pH balanced specifically for dogs.</p><ul><li>Soap-free formula</li><li>pH balanced for pets</li><li>Natural oatmeal & aloe</li><li>500ml bottle</li></ul>", "prices": [(899, "250ml"), (1499, "500ml")], "featured": False, "rating": 4.2, "reviews": 67},

    # Health & Wellness
    {"name": "Joint Care Supplement", "cat": "health-wellness", "brand": "Pooch & Mutt", "short": "Glucosamine and chondroitin complex for joint mobility.", "desc": "<h3>Move Freely</h3><p>A veterinary-strength joint supplement combining glucosamine, chondroitin, and MSM for optimal joint health and mobility.</p><ul><li>Glucosamine HCl</li><li>Chondroitin sulphate</li><li>MSM for flexibility</li><li>Tasty chicken flavour</li></ul>", "prices": [(1999, "60 tablets"), (3499, "120 tablets")], "featured": False, "rating": 4.6, "reviews": 203},
    {"name": "Pet First Aid Kit", "cat": "health-wellness", "brand": "Pets at Home Essentials", "short": "Comprehensive first aid kit for pet emergencies.", "desc": "<h3>Be Prepared</h3><p>Everything you need for minor pet emergencies in a compact, portable case. Includes bandages, antiseptic wipes, tick removers, and more.</p><ul><li>40+ essential items</li><li>Compact carry case</li><li>Instruction booklet</li><li>Tick removal tool included</li></ul>", "prices": [(2499, "Standard Kit")], "featured": False, "rating": 4.4, "reviews": 54},

    # Collars & Leads
    {"name": "Ruffwear Front Range Harness", "cat": "collars-leads", "brand": "Ruffwear", "short": "Padded, everyday adventure harness with two lead attachment points.", "desc": "<h3>Adventure Awaits</h3><p>An easy-on, everyday harness with padded chest and belly panels. Two lead attachment points offer versatile control.</p><ul><li>Two leash attachment points</li><li>Padded chest and belly</li><li>Four points of adjustment</li><li>ID pocket on back</li></ul>", "prices": [(3999, "Small"), (3999, "Medium"), (4299, "Large")], "featured": True, "rating": 4.8, "reviews": 412},
    {"name": "Leather Classic Collar", "cat": "collars-leads", "brand": "Pets at Home Essentials", "short": "Handcrafted full-grain leather collar with brass hardware.", "desc": "<h3>Timeless Style</h3><p>Crafted from full-grain English leather with solid brass fittings. Develops a beautiful patina with age.</p><ul><li>Full-grain leather</li><li>Solid brass hardware</li><li>Personalisation available</li><li>Lifetime guarantee</li></ul>", "prices": [(2499, "Small"), (2999, "Medium"), (3499, "Large")], "featured": False, "rating": 4.5, "reviews": 134},

    # Treats & Chews
    {"name": "Forthglade Natural Soft Bites", "cat": "treats-chews", "brand": "Forthglade", "short": "Irresistible training treats made with fresh meat.", "desc": "<h3>Training Made Easy</h3><p>Soft, bite-sized treats perfect for training. Made with freshly prepared meat and no artificial nasties.</p><ul><li>Grain-free recipe</li><li>Soft texture for all ages</li><li>Low calorie</li><li>No artificial preservatives</li></ul>", "prices": [(349, "90g"), (599, "150g")], "featured": False, "rating": 4.5, "reviews": 178},
    {"name": "Lily's Kitchen Bedtime Biscuits", "cat": "treats-chews", "brand": "Lily's Kitchen", "short": "Calming biscuits with honey, yoghurt, and chamomile.", "desc": "<h3>Sweet Dreams</h3><p>Baked with calming chamomile and honey to help your dog wind down at the end of the day. The perfect bedtime ritual.</p><ul><li>Organic chamomile</li><li>Natural honey</li><li>Crunchy baked texture</li><li>No artificial anything</li></ul>", "prices": [(399, "100g"), (699, "200g")], "featured": True, "rating": 4.7, "reviews": 245},

    # Travel & Outdoor
    {"name": "Ruffwear Quencher Bowl", "cat": "travel-outdoor", "brand": "Ruffwear", "short": "Collapsible, waterproof travel bowl for on-the-go hydration.", "desc": "<h3>Hydrate Anywhere</h3><p>A lightweight, collapsible bowl that clips to any lead or belt loop. Waterproof lining keeps water where it should be.</p><ul><li>Collapsible design</li><li>Waterproof lining</li><li>Clip attachment</li><li>Machine washable</li></ul>", "prices": [(1499, "Small"), (1799, "Large")], "featured": False, "rating": 4.6, "reviews": 167},
    {"name": "Premium Pet Carrier", "cat": "travel-outdoor", "brand": "Pets at Home Essentials", "short": "Airline-approved soft carrier with padded interior.", "desc": "<h3>Travel in Comfort</h3><p>IATA-approved soft-sided carrier with ventilation on all sides. Padded shoulder strap and fleece-lined interior for your pet's comfort.</p><ul><li>Airline approved (IATA)</li><li>Mesh ventilation panels</li><li>Fleece-lined interior</li><li>Multiple access points</li></ul>", "prices": [(3999, "Small"), (4999, "Medium")], "featured": False, "rating": 4.3, "reviews": 92},
]


class Command(BaseCommand):
    help = "Seed the database with realistic pet product mock data"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # Brands
        brands = {}
        for i, b in enumerate(BRANDS_DATA):
            brand = Brand.objects.create(sort_order=i)
            BrandTranslation.objects.create(brand=brand, language="en", name=b["name"], description=b["desc"])
            brand.slug = None
            brand.save()
            brands[b["name"]] = brand
            self.stdout.write(f"  Brand: {b['name']}")

        # Categories
        categories = {}
        for i, c in enumerate(CATEGORIES_DATA):
            cat = Category.objects.create(
                sort_order=i,
                image=CATEGORY_IMAGES.get(c["slug"], ""),
            )
            CategoryTranslation.objects.create(category=cat, language="en", name=c["name"], description=c["desc"])
            cat.slug = None
            cat.save()
            categories[c["slug"]] = cat
            self.stdout.write(f"  Category: {c['name']}")

        # Option Types
        weight_type = OptionType.objects.create(sort_order=0)
        OptionTypeTranslation.objects.create(option_type=weight_type, language="en", name="Size")

        # Products
        sku_counter = 1000
        for p in PRODUCTS_DATA:
            cat_slug = p["cat"]
            brand = brands.get(p["brand"])
            category = categories[cat_slug]
            images = IMAGE_MAP.get(cat_slug, DOG_FOOD_IMAGES)

            product = Product.objects.create(
                brand_id=brand.id if brand else None,
                is_featured=p.get("featured", False),
                average_rating=Decimal(str(p.get("rating", 0))),
                review_count=p.get("reviews", 0),
            )
            ProductTranslation.objects.create(
                product=product,
                language="en",
                name=p["name"],
                description=p["desc"],
                short_description=p["short"],
            )
            product.slug = None
            product.save()

            ProductCategory.objects.create(product=product, category_id=category.id)

            # Images
            img_url = random.choice(images)
            ProductImage.objects.create(
                product=product,
                url=img_url,
                alt_text=p["name"],
                is_primary=True,
                sort_order=0,
            )
            # Add 1-2 extra images
            for extra_i, extra_img in enumerate(random.sample(images, min(2, len(images)))):
                if extra_img != img_url:
                    ProductImage.objects.create(
                        product=product,
                        url=extra_img,
                        alt_text=f"{p['name']} — view {extra_i + 2}",
                        is_primary=False,
                        sort_order=extra_i + 1,
                    )

            # Variants
            for vi, (price, label) in enumerate(p["prices"]):
                sku_counter += 1
                ov = OptionValue.objects.create(option_type=weight_type, sort_order=vi)
                OptionValueTranslation.objects.create(option_value=ov, language="en", value=label)

                compare_price = None
                if random.random() < 0.25:
                    compare_price = int(price * random.uniform(1.15, 1.35))

                variant = ProductVariant.objects.create(
                    product=product,
                    sku=f"TPH-{sku_counter:05d}",
                    price=price,
                    compare_at_price=compare_price,
                    stock_quantity=random.randint(0, 120),
                    weight_grams=random.randint(200, 15000) if "kg" in label or "ml" in label else None,
                    sort_order=vi,
                )
                variant.option_values.add(ov)

            self.stdout.write(f"  Product: {p['name']} ({len(p['prices'])} variants)")

        total = Product.objects.count()
        self.stdout.write(self.style.SUCCESS(f"\nDone! {total} products, {len(brands)} brands, {len(categories)} categories seeded."))
