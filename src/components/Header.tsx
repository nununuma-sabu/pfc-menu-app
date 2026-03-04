import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeaderClientActions from './HeaderClientActions'

export default async function Header() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="font-bold text-xl text-blue-600 dark:text-blue-400">
                    PFC Balancer
                </Link>

                <div className="flex items-center gap-4 text-sm font-medium">
                    {user && (
                        <HeaderClientActions email={user.email} />
                    )}
                </div>
            </div>
        </header>
    )
}
