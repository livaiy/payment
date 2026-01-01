'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Clock, Users, Star, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

interface CourseCardProps {
  id: string
  title: string
  description: string
  thumbnail?: string
  price: number
  instructorName: string
  lessonCount: number
  duration: number
  rating: number
  studentCount: number
  categoryName?: string
}

export function CourseCard({
  id,
  title,
  description,
  thumbnail,
  price,
  instructorName,
  lessonCount,
  duration,
  rating,
  studentCount,
  categoryName
}: CourseCardProps) {
  const formatPrice = (price: number) => {
    if (price === 0) return 'Free'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <Play className="w-12 h-12 text-primary/30" />
          </div>
        )}
        {categoryName && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 text-xs font-medium rounded">
            {categoryName}
          </span>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {description}
        </p>
        <p className="text-sm text-muted-foreground mb-3">by {instructorName}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" />
            {lessonCount} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(duration || 0)}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {rating?.toFixed(1) || '0.0'}
          </span>
          <span className="text-xs text-muted-foreground">
            ({studentCount || 0} students)
          </span>
        </div>
        <span className="font-bold text-primary">
          {formatPrice(price || 0)}
        </span>
      </CardFooter>
      <Link href={`/courses/${id}`} className="absolute inset-0" />
    </Card>
  )
}

interface CourseListItemProps {
  id: string
  title: string
  description: string
  thumbnail?: string
  price: number
  instructorName: string
  lessonCount: number
  progress?: number
  enrolled?: boolean
}

export function CourseListItem({
  id,
  title,
  description,
  thumbnail,
  price,
  instructorName,
  lessonCount,
  progress,
  enrolled
}: CourseListItemProps) {
  const formatPrice = (price: number) => {
    if (price === 0) return 'Free'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Link href={enrolled ? `/student/course/${id}` : `/courses/${id}`}>
      <div className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
        <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>{instructorName}</span>
            <span>{lessonCount} lessons</span>
            {enrolled && progress !== undefined && (
              <span className="text-primary">{progress}% complete</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end justify-center gap-2 flex-shrink-0">
          <span className="font-bold">{formatPrice(price)}</span>
          {enrolled ? (
            <Button size="sm" variant={progress === 100 ? 'outline' : 'default'}>
              {progress === 100 ? 'Review' : 'Continue'}
            </Button>
          ) : (
            <Button size="sm">Enroll</Button>
          )}
        </div>
      </div>
    </Link>
  )
}
