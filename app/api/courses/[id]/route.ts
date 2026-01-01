import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { courses, lessons, categories, instructors } from '@/server/db/schema'
import { auth } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'

// GET /api/courses/[id] - Fetch single course with lessons
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const courseResult = await db.select({
      course: courses,
      category: categories.name,
      categoryId: categories.id,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.id, id))
    .get()

    if (!courseResult) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get instructor info
    const instructorResult = await db.select()
      .from(instructors)
      .where(eq(instructors.userId, courseResult.course.instructorId))
      .get()

    // Get lessons
    const courseLessons = await db.select()
      .from(lessons)
      .where(eq(lessons.courseId, id))
      .orderBy(lessons.orderIndex)
      .all()

    return NextResponse.json({
      ...courseResult,
      instructor: instructorResult,
      lessons: courseLessons,
    })
  } catch (error) {
    console.error('Failed to fetch course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

// PUT /api/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { title, description, price, categoryId, thumbnail, isPublished } = body

    // Check ownership
    const existingCourse = await db.select()
      .from(courses)
      .where(eq(courses.id, id))
      .get()

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (existingCourse.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const [updatedCourse] = await db.update(courses)
      .set({
        title: title || existingCourse.title,
        description: description || existingCourse.description,
        price: price !== undefined ? price : existingCourse.price,
        categoryId: categoryId || existingCourse.categoryId,
        thumbnail: thumbnail || existingCourse.thumbnail,
        isPublished: isPublished !== undefined ? isPublished : existingCourse.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning()

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error('Failed to update course:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const existingCourse = await db.select()
      .from(courses)
      .where(eq(courses.id, id))
      .get()

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (existingCourse.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await db.delete(courses).where(eq(courses.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
