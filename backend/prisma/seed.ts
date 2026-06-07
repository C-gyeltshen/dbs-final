import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import type { Product } from '@prisma/client'

const prisma = new PrismaClient()

const sellerEmail = 'seller@1minuteshop.com'
const adminEmail = 'admin@1minuteshop.com'

const hashPassword = (password: string, salt = randomBytes(16).toString('hex')) => {
  const passwordHash = pbkdf2Sync(password, salt, 100_000, 64, 'sha512').toString('hex')
  return { passwordHash, passwordSalt: salt }
}

const monthsAgo = (months: number, dayOffset = 0) => {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  date.setDate(Math.max(1, date.getDate() - dayOffset))
  return date
}

const customerSeeds = [
  ['Karma Dorji', 'karma.dorji@example.com'],
  ['Pema Choden', 'pema.choden@example.com'],
  ['Sonam Wangmo', 'sonam.wangmo@example.com'],
  ['Tashi Dendup', 'tashi.dendup@example.com'],
  ['Chimi Lhamo', 'chimi.lhamo@example.com'],
  ['Ugyen Tshering', 'ugyen.tshering@example.com'],
  ['Dechen Wangdi', 'dechen.wangdi@example.com'],
  ['Namgay Zam', 'namgay.zam@example.com'],
  ['Jigme Thinley', 'jigme.thinley@example.com'],
  ['Kinley Yangzom', 'kinley.yangzom@example.com'],
] as const

const categorySeeds = [
  {
    name: 'Electronics',
    subcategories: ['Audio', 'Gaming'],
    products: [
      ['Sony WH-1000XM5 Headphones', 'Premium wireless noise-cancelling headphones with rich audio and all-day comfort.', 329.99, ['audio', 'wireless', 'sony'], 36],
      ['Apple AirPods Pro 2', 'Compact true wireless earbuds with adaptive transparency and active noise cancellation.', 249.99, ['audio', 'earbuds', 'apple'], 42],
      ['Nintendo Switch OLED Console', 'Portable gaming console with vibrant OLED display and detachable controllers.', 349.99, ['gaming', 'console', 'nintendo'], 24],
      ['Logitech MX Master 3S Mouse', 'Ergonomic wireless productivity mouse with precise tracking and quiet clicks.', 99.99, ['mouse', 'wireless', 'logitech'], 58],
      ['Samsung 27-inch 4K Monitor', 'High-resolution 4K monitor for work, gaming, and entertainment.', 319.5, ['monitor', '4k', 'samsung'], 20],
      ['Anker 737 Power Bank', 'High-capacity fast-charging portable battery for phones, tablets, and laptops.', 139.99, ['power', 'charging', 'anker'], 44],
      ['Canon EOS R50 Camera', 'Mirrorless camera kit for creators, travel photography, and high-quality video.', 679.99, ['camera', 'canon', 'creator'], 12],
      ['Razer BlackWidow V4 Keyboard', 'Mechanical gaming keyboard with tactile switches and RGB lighting.', 169.99, ['keyboard', 'gaming', 'razer'], 26],
      ['Amazon Echo Dot 5th Gen', 'Smart speaker with Alexa, compact sound, and smart home control.', 49.99, ['speaker', 'smart-home', 'amazon'], 64],
      ['TP-Link AX3000 Router', 'Wi-Fi 6 router with reliable coverage and fast home networking.', 129.99, ['router', 'wifi', 'tplink'], 31],
    ],
  },
  {
    name: 'Clothing',
    subcategories: ['Shoes', 'Outerwear'],
    products: [
      ['Nike Air Max 270', 'Everyday sneakers with Max Air cushioning and a breathable mesh upper.', 149.99, ['shoes', 'nike', 'sneakers'], 45],
      ['Adidas Ultraboost Light', 'Responsive running shoes designed for comfort and energy return.', 189.99, ['shoes', 'adidas', 'running'], 33],
      ['Levi’s 501 Original Jeans', 'Classic straight-fit denim jeans with durable construction.', 79.99, ['jeans', 'denim', 'levis'], 52],
      ['Uniqlo Ultra Light Down Jacket', 'Packable lightweight jacket for cold-weather layering.', 89.9, ['jacket', 'winter', 'uniqlo'], 28],
      ['Patagonia Better Sweater Fleece', 'Warm fleece jacket made for casual wear and outdoor comfort.', 139.99, ['fleece', 'patagonia', 'outerwear'], 21],
      ['H&M Cotton Oxford Shirt', 'Crisp button-down cotton shirt for office or weekend wear.', 34.99, ['shirt', 'cotton', 'formal'], 62],
      ['The North Face Rain Jacket', 'Waterproof shell jacket for rain protection and travel.', 119.99, ['jacket', 'rain', 'north-face'], 30],
      ['Puma Essentials Hoodie', 'Soft fleece hoodie with relaxed fit and everyday comfort.', 54.99, ['hoodie', 'puma', 'casual'], 48],
      ['Under Armour Training Shorts', 'Lightweight training shorts with moisture-wicking fabric.', 32.99, ['shorts', 'training', 'under-armour'], 57],
      ['Columbia Hiking Pants', 'Durable outdoor pants with stretch fabric and water resistance.', 74.99, ['pants', 'hiking', 'columbia'], 35],
    ],
  },
  {
    name: 'Books',
    subcategories: ['Programming', 'Business'],
    products: [
      ['The Pragmatic Programmer', 'A practical guide to software craftsmanship and professional development habits.', 42.99, ['programming', 'software', 'career'], 40],
      ['Clean Code', 'A handbook of principles for writing readable and maintainable software.', 44.99, ['programming', 'clean-code', 'software'], 38],
      ['Designing Data-Intensive Applications', 'Deep coverage of distributed systems, databases, and data architecture.', 59.99, ['databases', 'systems', 'architecture'], 25],
      ['Atomic Habits', 'A practical framework for building good habits and breaking bad ones.', 21.99, ['self-help', 'habits', 'productivity'], 66],
      ['Deep Work', 'Strategies for focused success in a distracted world.', 19.99, ['productivity', 'focus', 'business'], 54],
      ['The Lean Startup', 'A startup methodology for building products through validated learning.', 24.99, ['startup', 'business', 'lean'], 43],
      ['NoSQL Distilled', 'Concise introduction to NoSQL databases and data modeling trade-offs.', 39.99, ['nosql', 'databases', 'architecture'], 29],
      ['Redis in Action', 'Practical guide to Redis data structures and application patterns.', 49.99, ['redis', 'database', 'backend'], 22],
      ['MongoDB: The Definitive Guide', 'Comprehensive guide to MongoDB data modeling, querying, and operations.', 54.99, ['mongodb', 'database', 'nosql'], 27],
      ['Start With Why', 'Business leadership book about purpose-driven organizations.', 18.99, ['business', 'leadership', 'strategy'], 50],
    ],
  },
  {
    name: 'Home & Kitchen',
    subcategories: ['Cookware', 'Furniture'],
    products: [
      ['Instant Pot Duo 7-in-1', 'Multi-use pressure cooker for fast meals, rice, soups, and stews.', 99.99, ['kitchen', 'pressure-cooker', 'instant-pot'], 32],
      ['Ninja Air Fryer Max XL', 'Countertop air fryer for crisp cooking with less oil.', 129.99, ['kitchen', 'air-fryer', 'ninja'], 26],
      ['Dyson V8 Cordless Vacuum', 'Lightweight cordless vacuum cleaner for floors and furniture.', 349.99, ['vacuum', 'cleaning', 'dyson'], 14],
      ['IKEA Markus Office Chair', 'Adjustable ergonomic office chair with mesh back support.', 199.99, ['chair', 'office', 'furniture'], 18],
      ['Philips Hue Starter Kit', 'Smart lighting kit with color bulbs and app control.', 179.99, ['lighting', 'smart-home', 'philips'], 24],
      ['KitchenAid Artisan Mixer', 'Stand mixer for baking, mixing, and kitchen preparation.', 449.99, ['mixer', 'baking', 'kitchenaid'], 10],
      ['Lodge Cast Iron Skillet', 'Pre-seasoned cast iron skillet for stovetop and oven cooking.', 29.99, ['cookware', 'skillet', 'lodge'], 70],
      ['Bodum French Press', 'Glass coffee press for rich manual brewing.', 34.99, ['coffee', 'kitchen', 'bodum'], 46],
      ['Muji Cotton Bedding Set', 'Soft cotton bedding set for clean and comfortable bedrooms.', 89.99, ['bedding', 'home', 'cotton'], 34],
      ['Simplehuman Sensor Trash Can', 'Touch-free stainless steel trash can for modern kitchens.', 159.99, ['kitchen', 'trash-can', 'home'], 16],
    ],
  },
  {
    name: 'Sports',
    subcategories: ['Fitness', 'Outdoor'],
    products: [
      ['Wilson Evolution Basketball', 'Indoor basketball with soft grip and consistent control.', 79.99, ['basketball', 'wilson', 'sports'], 36],
      ['Adidas FIFA Training Soccer Ball', 'Durable soccer ball for training sessions and practice.', 34.99, ['soccer', 'adidas', 'training'], 52],
      ['Manduka PRO Yoga Mat', 'High-density yoga mat with excellent grip and cushioning.', 119.99, ['yoga', 'fitness', 'manduka'], 28],
      ['Garmin Forerunner 265', 'GPS running watch with training metrics and AMOLED display.', 449.99, ['running', 'watch', 'garmin'], 19],
      ['Bowflex SelectTech Dumbbells', 'Adjustable dumbbell pair for home strength training.', 429.99, ['fitness', 'dumbbells', 'strength'], 12],
      ['Hydro Flask 32oz Bottle', 'Insulated stainless steel bottle for sports and travel.', 39.99, ['bottle', 'outdoor', 'hydration'], 61],
      ['Coleman Sundome Tent', 'Easy-setup camping tent for weekend outdoor trips.', 109.99, ['camping', 'tent', 'outdoor'], 22],
      ['Oakley Radar EV Sunglasses', 'Performance sunglasses for cycling, running, and outdoor sports.', 184.99, ['sunglasses', 'cycling', 'oakley'], 25],
      ['Theragun Mini Massager', 'Portable massage device for recovery and muscle relief.', 199.99, ['recovery', 'fitness', 'theragun'], 17],
      ['Speedo Vanquisher Goggles', 'Anti-fog swim goggles for training and lap swimming.', 24.99, ['swimming', 'goggles', 'speedo'], 58],
    ],
  },
] as const

const comments = [
  'Excellent quality and exactly as described.',
  'Arrived quickly and worked well out of the box.',
  'Good value for the price and feels durable.',
  'Very useful product, I would recommend it.',
  'The product matched the listing and packaging was neat.',
  'Performance is solid and the design feels premium.',
  'Bought this as a gift and the recipient loved it.',
  'Easy to use, practical, and reliable.',
  'Better than expected after a week of use.',
  'Decent purchase with good overall quality.',
]

async function main() {
  await prisma.accessToken.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.review.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany({
    where: {
      email: {
        notIn: [sellerEmail, adminEmail],
      },
    },
  })

  const seller = await prisma.user.upsert({
    where: { email: sellerEmail },
    update: {
      name: '1MinuteShop Seller',
      role: 'SELLER',
      addresses: [],
      wishlist: [],
      ...hashPassword('seller123'),
    },
    create: {
      email: sellerEmail,
      name: '1MinuteShop Seller',
      role: 'SELLER',
      addresses: [],
      wishlist: [],
      ...hashPassword('seller123'),
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: '1MinuteShop Admin',
      role: 'ADMIN',
      addresses: [],
      wishlist: [],
      ...hashPassword('admin123'),
    },
    create: {
      email: adminEmail,
      name: '1MinuteShop Admin',
      role: 'ADMIN',
      addresses: [],
      wishlist: [],
      ...hashPassword('admin123'),
    },
  })

  const customers = await Promise.all(customerSeeds.map(([name, email]) => prisma.user.create({
    data: {
      name,
      email,
      role: 'CUSTOMER',
      addresses: [
        {
          street: `${Math.floor(Math.random() * 90) + 10} Norzin Lam`,
          city: 'Thimphu',
          country: 'Bhutan',
          zip: '11001',
        },
      ],
      wishlist: [],
      ...hashPassword('customer123'),
    },
  })))

  const categories = new Map<string, { id: string; parentId: string | null }>()

  for (const category of categorySeeds) {
    const parent = await prisma.category.create({
      data: {
        name: category.name,
        parentId: null,
      },
    })
    categories.set(category.name, { id: parent.id, parentId: null })

    for (const subcategory of category.subcategories) {
      const child = await prisma.category.create({
        data: {
          name: subcategory,
          parentId: parent.id,
        },
      })
      categories.set(subcategory, { id: child.id, parentId: parent.id })
    }
  }

  const products: Product[] = []

  for (const category of categorySeeds) {
    const subcategoryIds = category.subcategories.map((name) => categories.get(name)?.id).filter((id): id is string => !!id)

    for (const [index, [name, description, price, tags, stock]] of category.products.entries()) {
      const product = await prisma.product.create({
        data: {
          name,
          description,
          price,
          categoryId: subcategoryIds[index % subcategoryIds.length],
          tags: [...tags],
          attributes: {
            brand: name.split(' ')[0],
            topLevelCategory: category.name,
          },
          variants: [
            {
              sku: `${category.name.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}-A`,
              color: 'Black',
              stock: Math.floor(stock / 2),
              price,
            },
            {
              sku: `${category.name.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}-B`,
              color: 'White',
              size: ['S', 'M', 'L'][index % 3],
              stock: stock - Math.floor(stock / 2),
              price: Number((price * 1.03).toFixed(2)),
            },
          ],
          stock,
          sellerId: seller.id,
        },
      })

      products.push(product)

      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: stock,
        },
      })
    }
  }

  const statuses = [
    'DELIVERED', 'PLACED',
    'DELIVERED', 'CONFIRMED',
    'DELIVERED', 'SHIPPED',
    'DELIVERED', 'CANCELLED',
    'DELIVERED', 'PLACED',
    'DELIVERED', 'CONFIRMED',
    'DELIVERED', 'SHIPPED',
    'DELIVERED', 'CANCELLED',
    'DELIVERED', 'PLACED',
    'DELIVERED', 'CONFIRMED',
  ] as const

  const deliveredReviewCandidates: Array<{ userId: string; productId: string; createdAt: Date }> = []

  for (let customerIndex = 0; customerIndex < customers.length; customerIndex += 1) {
    const customer = customers[customerIndex]

    for (let orderIndex = 0; orderIndex < 2; orderIndex += 1) {
      const globalOrderIndex = customerIndex * 2 + orderIndex
      const lineItemCount = orderIndex === 0 ? 3 : 2 + (customerIndex % 3)
      const selectedProducts = Array.from({ length: lineItemCount }, (_, itemIndex) => (
        products[(globalOrderIndex * 3 + itemIndex * 7) % products.length]
      ))
      const lineItems = selectedProducts.map((product, itemIndex) => ({
        product,
        quantity: 1 + ((customerIndex + itemIndex) % 2),
        price: product.price,
      }))
      const total = Number(lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2))
      const status = statuses[globalOrderIndex]
      const createdAt = monthsAgo(globalOrderIndex % 6, globalOrderIndex)

      const order = await prisma.order.create({
        data: {
          userId: customer.id,
          status,
          total,
          createdAt,
          updatedAt: createdAt,
        },
      })

      for (const item of lineItems) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            quantity: item.quantity,
            price: item.price,
          },
        })

        if (status === 'DELIVERED') {
          deliveredReviewCandidates.push({
            userId: customer.id,
            productId: item.product.id,
            createdAt,
          })
        }
      }
    }
  }

  for (const [index, candidate] of deliveredReviewCandidates.slice(0, 30).entries()) {
    const createdAt = new Date(candidate.createdAt)
    createdAt.setDate(createdAt.getDate() + 5)

    await prisma.review.create({
      data: {
        userId: candidate.userId,
        productId: candidate.productId,
        rating: (index % 5) + 1,
        comment: comments[index % comments.length],
        createdAt,
      },
    })
  }

  const [
    userCount,
    categoryCount,
    productCount,
    inventoryCount,
    orderCount,
    orderItemCount,
    reviewCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.inventory.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.review.count(),
  ])

  console.log('Seed completed successfully.')
  console.log(`Users: ${userCount} (seller: ${seller.email}, admin: ${admin.email}, customers: ${customers.length})`)
  console.log(`Categories: ${categoryCount}`)
  console.log(`Products: ${productCount}`)
  console.log(`Inventory: ${inventoryCount}`)
  console.log(`Orders: ${orderCount}`)
  console.log(`OrderItems: ${orderItemCount}`)
  console.log(`Reviews: ${reviewCount}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
