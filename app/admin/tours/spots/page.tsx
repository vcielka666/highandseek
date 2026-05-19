import { connectDB }    from '@/lib/db/connect'
import CannabisSpotModel from '@/lib/db/models/CannabisSpot'
import AdminPageHeader   from '@/components/admin/AdminPageHeader'
import SpotsClient       from './SpotsClient'
import type { SpotRow }  from './SpotsClient'

export default async function AdminTourSpotsPage() {
  await connectDB()

  const rawSpots = await CannabisSpotModel
    .find()
    .sort({ verified: 1, createdAt: -1 })
    .lean()

  const initialSpots: SpotRow[] = rawSpots.map((s) => ({
    _id:       String(s._id),
    name:      s.name,
    city:      s.city,
    type:      s.type,
    verified:  s.verified,
    featured:  s.featured,
    isActive:  s.isActive,
    address:   s.address,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : '',
  }))

  return (
    <div>
      <AdminPageHeader
        title="Cannabis Spots"
        description="Verify and manage cannabis spots used in tours"
      />
      <SpotsClient initialSpots={initialSpots} />
    </div>
  )
}
