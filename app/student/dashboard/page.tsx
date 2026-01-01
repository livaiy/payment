'use client'

import { useEffect, useState } from 'react'
import { StudentHeader } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, Award, TrendingUp, Play } from 'lucide-react'
import Link from 'next/link'

interface Enrollment {
  enrollment: {
    id: string
    courseId: string
    progress: number
    enrolledAt: Date
  }
  course: {
    id: string
    title: string
    description: string
    thumbnail: string | null
    instructorId: string
  }
  instructorName?: string | null
}

export default function StudentDashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/auth')
      return
    }
    fetchEnrollments()
  }, [session, isPending, router])

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/enrollments')
      if (response.ok) {
        const data = await response.json()
        setEnrollments(data)
      }
    } catch (error) {
      console.error('Failed to fetch enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const totalCourses = enrollments.length
  const completedCourses = enrollments.filter(e => e.enrollment.progress === 100).length
  const totalProgress = enrollments.reduce((sum, e) => sum + (e.enrollment.progress || 0), 0)
  const avgProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">My Courses</p>
                  <p className="text-2xl font-bold">{totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Progress</p>
                  <p className="text-2xl font-bold">{avgProgress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours Learned</p>
                  <p className="text-2xl font-bold">24h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Learning Section */}
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start learning by enrolling in a course
                </p>
                <Link href="/courses">
                  <Button>Browse Courses</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {enrollments.map((item) => (
                  <div
                    key={item.enrollment.id}
                    className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className="w-full md:w-48 h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.course.thumbnail ? (
                        <img
                          src={item.course.thumbnail}
                          alt={item.course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{item.course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.course.description}
                      </p>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{item.enrollment.progress}%</span>
                        </div>
                        <Progress value={item.enrollment.progress} className="h-2" />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 flex-shrink-0">
                      <Link href={`/student/course/${item.course.id}`}>
                        <Button>
                          <Play className="w-4 h-4 mr-2" />
                          {item.enrollment.progress === 0 ? 'Start' : 'Continue'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browse More Courses */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Looking for more courses to learn?</p>
          <Link href="/courses">
            <Button variant="outline">Browse All Courses</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
