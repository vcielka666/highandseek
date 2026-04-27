import { redirect } from 'next/navigation'

// /hub/feed redirects to hub home where the feed card is
// Users open the feed via the bento grid card
export default function FeedPage() {
  redirect('/hub')
}
