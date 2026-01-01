import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { db } from '@/server/db'
import { enrollments, courses, lessons, lessonProgress, instructors } from '@/server/db/schema'
import { auth } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'

// GET /api/enrollments - Get user's enrollments
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

    const userEnrollments = await db.select({
      enrollment: enrollments,
      course: courses,
      instructorName: instructors.bio,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(instructors, eq(instructors.userId, courses.instructorId))
    .where(eq(enrollments.userId, session.user.id))
    .orderBy(desc(enrollments.enrolledAt))
    .all()

    return NextResponse.json(userEnrollments)
  } catch (error) {
    console.error('Failed to fetch enrollments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}

// POST /api/enrollments - Create enrollment (free courses or after payment)
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
    const { courseId, paymentId } = body

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const existing = await db.select()
      .from(enrollments)
      .where(eq(enrollments.userId, session.user.id))
      .where(eq(enrollments.courseId, courseId))
      .get()

    if (existing) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      )
    }

    const [newEnrollment] = await db.insert(enrollments).values({
      id: nanoid(),
      userId: session.user.id,
      courseId,
      paymentId,
      paymentStatus: paymentId ? 'paid' : 'free',
    }).returning()

    return NextResponse.json(newEnrollment, { status: 201 })
  } catch (error) {
    console.error('Failed to create enrollment:', error)
    return NextResponse.json(
      { error: 'Failed to create enrollment' },
      { status: 500 }
    )
  }
}

// PUT /api/enrollments/[id] - Update enrollment progress
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
    const { progress, completedLessons } = body

    const [updatedEnrollment] = await db.update(enrollments)
      .set({
        progress: progress || 0,
        completedLessons: completedLessons ? JSON.stringify(completedLessons) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, id))
      .where(eq(enrollments.userId, session.user.id))
      .returning()

    if (!updatedEnrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedEnrollment)
  } catch (error) {
    console.error('Failed to update enrollment:', error)
    return NextResponse.json(
      { error: 'Failed to update enrollment' },
      { status: 500 }
    )
  }
}
