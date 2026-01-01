import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { categories } from '@/server/db/schema'
import { desc } from 'drizzle-orm'

// GET /api/categories - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const allCategories = await db.select()
      .from(categories)
      .orderBy(categories.name)
      .all()

    return NextResponse.json(allCategories)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const [newCategory] = await db.insert(categories).values({
      name,
      slug,
      description,
    }).returning()

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
