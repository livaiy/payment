'use client'

import { useEffect, useState } from 'react'
import { StudentHeader } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useSession } from '@/lib/auth-client'
import { useRouter, useParams } from 'next/navigation'
import { 
  Play, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Lock,
  Clock,
  FileText,
  Video
} from 'lucide-react'
import Link from 'next/link'

interface Lesson {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  duration: number | null
  materials: string | null
  isFree: boolean
  orderIndex: number
}

interface CourseData {
  course: {
    id: string
    title: string
    description: string
    thumbnail: string | null
    instructorId: string
  }
  lessons: Lesson[]
  enrollment?: {
    id: string
    progress: number
    completedLessons: string | null
  }
}

export default function CoursePlayerPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth')
      return
    }
    fetchCourse()
  }, [session, router, courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourseData(data)
        
        // Get completed lessons from enrollment
        if (data.enrollment?.completedLessons) {
          setCompletedLessons(JSON.parse(data.enrollment.completedLessons))
        }
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsComplete = async (lessonId: string) => {
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          courseId,
          isCompleted: true,
        }),
      })

      if (response.ok) {
        setCompletedLessons(prev => [...prev, lessonId])
        updateProgress()
      }
    } catch (error) {
      console.error('Failed to mark lesson as complete:', error)
    }
  }

  const updateProgress = async () => {
    if (!courseData) return
    
    const lessons = courseData.lessons
    const progress = Math.round((completedLessons.length / lessons.length) * 100)
    
    try {
      await fetch('/api/enrollments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          progress,
          completedLessons: completedLessons,
        }),
      })
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const goToNextLesson = () => {
    if (courseData && currentLessonIndex < courseData.lessons.length - 1) {
      setCurrentLessonIndex(prev => prev + 1)
    }
  }

  const goToPrevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(prev => prev - 1)
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Course not found</p>
      </div>
    )
  }

  const currentLesson = courseData.lessons[currentLessonIndex]
  const isLastLesson = currentLessonIndex === courseData.lessons.length - 1
  const isFirstLesson = currentLessonIndex === 0
  const isCompleted = completedLessons.includes(currentLesson?.id || '')

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/student/dashboard" className="text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">{courseData.course.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <Progress value={completedLessons.length} max={courseData.lessons.length} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">
              {completedLessons.length}/{courseData.lessons.length} completed
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <Card>
              <div className="aspect-video bg-black rounded-t-lg flex items-center justify-center">
                {currentLesson?.videoUrl ? (
                  <iframe
                    src={currentLesson.videoUrl.replace('watch?v=', 'embed/')}
                    className="w-full h-full rounded-t-lg"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-white text-center">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No video available</p>
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{currentLesson?.title}</h2>
                    {currentLesson?.description && (
                      <p className="text-muted-foreground mt-2">{currentLesson.description}</p>
                    )}
                  </div>
                  {isCompleted ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => markAsComplete(currentLesson.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Complete
                    </Button>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={goToPrevLesson}
                    disabled={isFirstLesson}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  {!isLastLesson ? (
                    <Button onClick={goToNextLesson}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Link href="/student/dashboard">
                      <Button>Finish Course</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lesson List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Content</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {courseData.lessons.map((lesson, index) => {
                    const lessonCompleted = completedLessons.includes(lesson.id)
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setCurrentLessonIndex(index)}
                        className={`w-full flex items-center gap-3 p-3 text-left hover:bg-accent transition-colors ${
                          currentLessonIndex === index ? 'bg-accent' : ''
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          lessonCompleted ? 'bg-green-500 text-white' : 'bg-muted'
                        }`}>
                          {lessonCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{lesson.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDuration(lesson.duration)}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
