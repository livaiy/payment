import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { courses, lessons, enrollments } from '@/server/db/schema'
import { auth } from '@/lib/auth'
import { eq, desc, count } from 'drizzle-orm'

// GET /api/instructor/courses - Get instructor's courses with stats
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

    const instructorCourses = await db.select({
      course: courses,
      lessonCount: count(lessons.id),
      enrollmentCount: count(enrollments.id),
    })
    .from(courses)
    .leftJoin(lessons, eq(lessons.courseId, courses.id))
    .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
    .where(eq(courses.instructorId, session.user.id))
    .groupBy(courses.id)
    .orderBy(desc(courses.createdAt))
    .all()

    return NextResponse.json(instructorCourses)
  } catch (error) {
    console.error('Failed to fetch instructor courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instructor courses' },
      { status: 500 }
    )
  }
}
