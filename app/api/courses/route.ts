import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { db } from '@/server/db'
import { courses, categories } from '@/server/db/schema'
import { auth } from '@/lib/auth'
import { desc, eq } from 'drizzle-orm'

// GET /api/courses - Fetch all published courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')

    let query = db.select({
      course: courses,
      categoryName: categories.name,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.isPublished, true))
    .orderBy(desc(courses.createdAt))

    if (categoryId) {
      // Reconstruct query with category filter
      const allCourses = await db.select()
        .from(courses)
        .leftJoin(categories, eq(courses.categoryId, categories.id))
        .where(eq(courses.isPublished, true))
        .orderBy(desc(courses.createdAt))
      
      const filtered = allCourses.filter(c => c.courses.categoryId === categoryId)
      return NextResponse.json(filtered)
    }

    if (search) {
      const allCourses = await db.select()
        .from(courses)
        .leftJoin(categories, eq(courses.categoryId, categories.id))
        .where(eq(courses.isPublished, true))
        .orderBy(desc(courses.createdAt))
      
      const filtered = allCourses.filter(c => 
        c.courses.title.toLowerCase().includes(search.toLowerCase()) ||
        c.courses.description.toLowerCase().includes(search.toLowerCase())
      )
      return NextResponse.json(filtered)
    }

    const allCourses = await query
    return NextResponse.json(allCourses)
  } catch (error) {
    console.error('Failed to fetch courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, price, categoryId, thumbnail } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const [newCourse] = await db.insert(courses).values({
      id: nanoid(),
      title,
      slug,
      description,
      price: price || 0,
      categoryId,
      thumbnail,
      instructorId: session.user.id,
      isPublished: false,
    }).returning()

    return NextResponse.json(newCourse, { status: 201 })
  } catch (error) {
    console.error('Failed to create course:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
