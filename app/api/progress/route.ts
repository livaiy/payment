import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { lessonProgress, lessons, enrollments } from '@/server/db/schema'
import { auth } from '@/lib/auth'
import { eq } from 'drizzle-orm'

// GET /api/progress - Get user's progress for a course
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      )
    }

    // Get enrollment
    const enrollment = await db.select()
      .from(enrollments)
      .where(eq(enrollments.userId, session.user.id))
      .where(eq(enrollments.courseId, courseId))
      .get()

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 404 }
      )
    }

    // Get lesson progress
    const lessonIds = await db.select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .all()

    const progress = await db.select()
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, session.user.id))
      .where(eq(lessonProgress.lessonId, lessonIds[0]?.id || ''))
      .all()

    return NextResponse.json({
      enrollment,
      completedLessons: enrollment.completedLessons ? JSON.parse(enrollment.completedLessons) : [],
    })
  } catch (error) {
    console.error('Failed to fetch progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}

// POST /api/progress - Mark lesson as completed
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
    const { lessonId, courseId, isCompleted } = body

    if (!lessonId || !courseId) {
      return NextResponse.json(
        { error: 'lessonId and courseId are required' },
        { status: 400 }
      )
    }

    // Check if already has progress record
    const existing = await db.select()
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, session.user.id))
      .where(eq(lessonProgress.lessonId, lessonId))
      .get()

    if (existing) {
      const [updated] = await db.update(lessonProgress)
        .set({
          isCompleted: isCompleted || !existing.isCompleted,
          completedAt: isCompleted ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(lessonProgress.id, existing.id))
        .returning()
      return NextResponse.json(updated)
    }

    const [newProgress] = await db.insert(lessonProgress).values({
      userId: session.user.id,
      lessonId,
      isCompleted: isCompleted || false,
      completedAt: isCompleted ? new Date() : null,
    }).returning()

    return NextResponse.json(newProgress, { status: 201 })
  } catch (error) {
    console.error('Failed to update progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
