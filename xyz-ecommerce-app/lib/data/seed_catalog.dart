import '../models/commerce_models.dart';

const List<String> storefrontCategories = [
  'All',
  'Outerwear',
  'Dresses',
  'Bags',
  'Shoes',
  'Accessories',
  'Knitwear',
];

List<Product> buildSeedProducts() {
  return const [
    Product(
      id: 'atelier-trench',
      name: 'Atelier Belted Trench',
      brand: 'XYZ Atelier',
      category: 'Outerwear',
      price: 248,
      originalPrice: 320,
      imageUrl:
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
      ],
      description:
          'A sharply cut trench with soft drape, editorial lapels, and a belt that shifts from polished commute layer to evening statement.',
      materials: 'Water-resistant cotton twill with matte horn-style buttons.',
      fitNotes: 'Relaxed over the shoulder with a defined waist once belted.',
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Sand', 'Ink'],
      rating: 4.8,
      reviewCount: 129,
      badges: ['New Season', 'Editor Pick'],
    ),
    Product(
      id: 'luna-slip',
      name: 'Luna Silk Column Dress',
      brand: 'XYZ Atelier',
      category: 'Dresses',
      price: 186,
      imageUrl:
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=900&q=80',
      ],
      description:
          'A liquid-bias silhouette designed for effortless evening movement with enough structure to layer under outerwear.',
      materials:
          'Silk blend satin with tonal lining and narrow strap hardware.',
      fitNotes:
          'Bias cut; choose your true size for drape, size up for a looser skim.',
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Olive', 'Black'],
      rating: 4.7,
      reviewCount: 82,
      badges: ['Occasion'],
    ),
    Product(
      id: 'forma-bag',
      name: 'Forma Mini Crossbody',
      brand: 'Northline',
      category: 'Bags',
      price: 154,
      imageUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',
      ],
      description:
          'A compact crossbody with structured corners, premium hardware, and room for the essentials without visual clutter.',
      materials: 'Pebbled vegan leather with microfiber lining.',
      fitNotes:
          'Compact silhouette; fits phone, cardholder, keys, and lipstick.',
      sizes: ['One Size'],
      colors: ['Cream', 'Mulberry', 'Jet'],
      rating: 4.9,
      reviewCount: 211,
      badges: ['Best Seller'],
    ),
    Product(
      id: 'vela-heel',
      name: 'Vela Sculpted Heel',
      brand: 'Studio Ratio',
      category: 'Shoes',
      price: 198,
      imageUrl:
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80',
      ],
      description:
          'An almond-toe heel with an architectural curve that adds lift without tipping into trend fatigue.',
      materials: 'Gloss leather upper, leather sock lining, rubberized sole.',
      fitNotes: 'Runs slightly narrow; size up if between sizes.',
      sizes: ['36', '37', '38', '39', '40'],
      colors: ['Merlot', 'Bone'],
      rating: 4.6,
      reviewCount: 63,
      badges: ['Limited'],
    ),
    Product(
      id: 'meridian-knit',
      name: 'Meridian Rib Knit',
      brand: 'Atelier Soft',
      category: 'Knitwear',
      price: 112,
      imageUrl:
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
      ],
      description:
          'A close rib knit with elongated cuffs, clean neckline, and a polished weight that works tucked or relaxed.',
      materials: 'Merino blend knit with shape recovery stretch.',
      fitNotes: 'Slim fit through body and sleeve.',
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Stone', 'Forest', 'Ink'],
      rating: 4.5,
      reviewCount: 96,
      badges: ['Core Wardrobe'],
    ),
    Product(
      id: 'halo-hoops',
      name: 'Halo Mini Hoops',
      brand: 'Noon Objects',
      category: 'Accessories',
      price: 68,
      imageUrl:
          'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80',
      ],
      description:
          'Small polished hoops that brighten a minimal outfit without taking over the silhouette.',
      materials: '18k gold plated brass with hypoallergenic posts.',
      fitNotes: 'Lightweight everyday pair.',
      sizes: ['One Size'],
      colors: ['Gold', 'Silver'],
      rating: 4.9,
      reviewCount: 144,
      badges: ['Giftable'],
    ),
    Product(
      id: 'archive-tote',
      name: 'Archive Carryall Tote',
      brand: 'Northline',
      category: 'Bags',
      price: 236,
      imageUrl:
          'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',
      ],
      description:
          'A structured daily tote sized for laptop, notebook, and transit essentials while staying refined enough for evening carry.',
      materials: 'Soft-grain leather with suede interior base panel.',
      fitNotes: 'Designed as a work-to-weekend carryall.',
      sizes: ['One Size'],
      colors: ['Black', 'Espresso'],
      rating: 4.8,
      reviewCount: 171,
      badges: ['Work Edit'],
    ),
    Product(
      id: 'solstice-shades',
      name: 'Solstice Oval Sunglasses',
      brand: 'Noon Objects',
      category: 'Accessories',
      price: 92,
      imageUrl:
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80',
      ],
      description:
          'Soft oval frames with a slightly oversized lens profile to sharpen simple outfits and travel looks.',
      materials: 'Acetate frame with UV400 lenses.',
      fitNotes: 'Medium fit with lightweight arms for day-long wear.',
      sizes: ['One Size'],
      colors: ['Espresso', 'Ivory'],
      rating: 4.6,
      reviewCount: 58,
      badges: ['Travel Edit'],
    ),
  ];
}
