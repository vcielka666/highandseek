import { notFound }   from 'next/navigation'
import { connectDB }  from '@/lib/db/connect'
import TourModel      from '@/lib/db/models/Tour'
import type { IStop } from '@/lib/db/models/Tour'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import TourFormClient  from '../TourFormClient'
import type { TourFormData } from '../TourFormClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AdminTourEditPage({ params }: Props) {
  const { slug } = await params
  await connectDB()

  const raw = await TourModel.findOne({ slug }).lean()
  if (!raw) notFound()

  const tour = raw as typeof raw & { _id: unknown }

  const initialData: TourFormData = {
    title:            tour.title,
    slug:             tour.slug,
    city:             tour.city,
    country:          tour.country,
    duration:         tour.duration,
    maxGuests:        tour.maxGuests,
    languages:        tour.languages ?? [],
    priceEur:         tour.price?.eur     ?? 0,
    priceCzk:         tour.price?.czk     ?? 0,
    priceCredits:     tour.price?.credits  ?? 0,
    shortDescription: tour.shortDescription ?? '',
    description:      tour.description     ?? '',
    category:         tour.category,
    included:         tour.included     ?? [],
    notIncluded:      tour.notIncluded  ?? [],
    requirements:     tour.requirements ?? [],
    stops:            (tour.stops ?? []).map((s: IStop) => ({
      order:       s.order,
      title:       s.title,
      description: s.description ?? '',
      type:        s.type,
      duration:    s.duration,
      lat:         s.lat,
      lng:         s.lng,
    })),
    meetingPointAddress:     tour.meetingPoint?.address     ?? '',
    meetingPointLat:         tour.meetingPoint?.lat         ?? 0,
    meetingPointLng:         tour.meetingPoint?.lng         ?? 0,
    meetingPointDescription: tour.meetingPoint?.description ?? '',
    hostName:       tour.host?.name     ?? '',
    hostBio:        tour.host?.bio      ?? '',
    hostVerified:   tour.host?.verified ?? false,
    isActive:       tour.isActive,
    isFeatured:     tour.isFeatured,
    isComingSoon:   tour.isComingSoon,
    coverImage:     tour.coverImage ?? '',
  }

  return (
    <div>
      <AdminPageHeader
        title="Edit Tour"
        description={`Editing: ${tour.title}`}
      />
      <TourFormClient mode="edit" initialData={initialData} slug={slug} />
    </div>
  )
}
