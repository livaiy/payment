'use client'

import { useEffect, useState } from 'react'
import { InstructorHeader } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useSession } from '@/lib/auth-client'
import { useRouter, useParams } from 'next/navigation'
import { Plus, Play, Clock, Edit, Trash2, GripVertical, Video, FileText } from 'lucide-react'

interface Lesson {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  duration: number | null
  orderIndex: number
  isFree: boolean
  courseId: string
}

interface CourseInfo {
  course: {
    id: string
    title: string
    description: string
  }
  lessons: Lesson[]
}

export default function InstructorLessonsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: 0,
    isFree: false,
  })

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
        setCourseInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLesson,
          courseId,
          orderIndex: (courseInfo?.lessons.length || 0),
        }),
      })

      if (response.ok) {
        setCreateDialogOpen(false)
        setNewLesson({ title: '', description: '', videoUrl: '', duration: 0, isFree: false })
        fetchCourse()
      }
    } catch (error) {
      console.error('Failed to create lesson:', error)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return
    
    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchCourse()
      }
    } catch (error) {
      console.error('Failed to delete lesson:', error)
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

  if (!courseInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Course not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <InstructorHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{courseInfo.course.title}</h1>
            <p className="text-muted-foreground">Manage course lessons and content</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Lesson</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-title">Lesson Title</Label>
                  <Input
                    id="lesson-title"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    placeholder="e.g., Introduction to HTML"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-description">Description</Label>
                  <Textarea
                    id="lesson-description"
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                    placeholder="What will students learn in this lesson?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-video">Video URL</Label>
                  <Input
                    id="lesson-video"
                    value={newLesson.videoUrl}
                    onChange={(e) => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-duration">Duration (seconds)</Label>
                  <Input
                    id="lesson-duration"
                    type="number"
                    value={newLesson.duration}
                    onChange={(e) => setNewLesson({ ...newLesson, duration: Number(e.target.value) })}
                    placeholder="300"
                    min="0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFree"
                    checked={newLesson.isFree}
                    onChange={(e) => setNewLesson({ ...newLesson, isFree: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isFree">Free preview lesson</Label>
                </div>
                <Button type="submit" className="w-full">Add Lesson</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lessons List */}
        <Card>
          <CardHeader>
            <CardTitle>Course Lessons ({courseInfo.lessons.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {courseInfo.lessons.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No lessons yet</h3>
                <p className="text-muted-foreground mb-4">Add your first lesson to start teaching</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lesson
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {courseInfo.lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Play className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{lesson.title}</h4>
                        {lesson.isFree && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            Free
                          </span>
                        )}
                      </div>
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(lesson.duration)}
                      </span>
                      {lesson.videoUrl && (
                        <span className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          Video
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLesson(lesson.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
