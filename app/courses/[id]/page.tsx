'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useSession } from '@/lib/auth-client'
import { useRouter, useParams } from 'next/navigation'
import { 
  Clock, 
  Play, 
  Users, 
  Star, 
  BookOpen, 
  CheckCircle2, 
  Globe,
  Lock,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'

interface CourseDetail {
  course: {
    id: string
    title: string
    description: string
    thumbnail: string | null
    price: number
    instructorId: string
    isPublished: boolean
  }
  category: string
  instructor?: {
    bio: string | null
    expertise: string | null
    avatar: string | null
  }
  lessons: {
    id: string
    title: string
    description: string | null
    duration: number | null
    isFree: boolean
    orderIndex: number
  }[]
}

export default function CourseDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    fetchCourse()
    checkEnrollment()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)
      }
    } catch (error) {
      console.error('Failed to fetch course:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkEnrollment = async () => {
    if (!session?.user) return
    try {
      const response = await fetch('/api/enrollments')
      if (response.ok) {
        const enrollments = await response.json()
        const isEnrolled = enrollments.some((e: any) => e.enrollment.courseId === courseId)
        setEnrolled(isEnrolled)
      }
    } catch (error) {
      console.error('Failed to check enrollment:', error)
    }
  }

  const handleEnroll = async () => {
    if (!session?.user) {
      router.push('/auth')
      return
    }

    if (course?.course.price === 0) {
      // Free course - enroll directly
      try {
        const response = await fetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })

        if (response.ok) {
          setEnrolled(true)
          router.push(`/student/course/${courseId}`)
        }
      } catch (error) {
        console.error('Failed to enroll:', error)
      }
    } else {
      // Paid course - initiate payment
      setPaymentDialogOpen(true)
    }
  }

  const handlePayment = async () => {
    setProcessingPayment(true)
    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: `enroll-${courseId}-${session?.user.id}`,
          amount: course?.course.price,
          description: `Enrollment: ${course?.course.title}`,
          customer: {
            given_names: session?.user.name?.split(' ')[0],
            email: session?.user.email,
          },
          items: [{
            name: course?.course.title,
            quantity: 1,
            price: course?.course.price,
          }],
        }),
      })

      if (response.ok) {
        const { paymentUrl } = await response.json()
        window.location.href = paymentUrl
      }
    } catch (error) {
      console.error('Payment failed:', error)
      setProcessingPayment(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
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

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Course not found</p>
      </div>
    )
  }

  const totalDuration = course.lessons.reduce((sum, l) => sum + (l.duration || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-muted/50 to-background py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.course.title}</h1>
                <p className="text-lg text-muted-foreground mb-6">{course.course.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    4.8 (128 reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    1,250 students
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(totalDuration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course.lessons.length} lessons
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {course.instructor?.bio?.charAt(0) || 'I'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">Created by</p>
                    <p className="font-medium">Instructor</p>
                  </div>
                </div>
              </div>

              {/* Enrollment Card */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                    {course.course.thumbnail ? (
                      <img
                        src={course.course.thumbnail}
                        alt={course.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold mb-4">
                      {formatPrice(course.course.price)}
                    </div>
                    
                    {enrolled ? (
                      <Link href={`/student/course/${courseId}`}>
                        <Button className="w-full" size="lg">
                          <Play className="w-4 h-4 mr-2" />
                          Continue Learning
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="lg" 
                        onClick={handleEnroll}
                      >
                        {course.course.price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                      </Button>
                    )}

                    <Separator className="my-4" />

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>Lifetime access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>Certificate of completion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>{course.lessons.length} video lessons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>Access on mobile and desktop</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Course Content</h2>
              
              <div className="space-y-3">
                {course.lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{lesson.title}</h4>
                        {lesson.isFree && (
                          <Badge variant="secondary" className="text-xs">
                            Free Preview
                          </Badge>
                        )}
                      </div>
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                      {lesson.isFree || enrolled ? (
                        <span className="flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          {formatDuration(lesson.duration)}
                        </span>
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              You will be redirected to Xendit to complete your payment securely.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="text-center mb-6">
              <p className="text-3xl font-bold">{formatPrice(course.course.price)}</p>
              <p className="text-muted-foreground">{course.course.title}</p>
            </div>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handlePayment}
              disabled={processingPayment}
            >
              {processingPayment ? 'Processing...' : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with Xendit
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Secure payment powered by Xendit. Accepts various payment methods including bank transfer, e-wallets, and more.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
