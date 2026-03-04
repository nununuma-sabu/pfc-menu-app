import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Heart } from 'lucide-react'
import LogoutButton from './LogoutButton'

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
                        <div className="flex items-center gap-4">
                            <Link href="/favorites" className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 transition-colors font-semibold">
                                <Heart className="w-4 h-4" />
                                <span className="hidden sm:inline">お気に入り</span>
                            </Link>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span className="text-gray-600 dark:text-gray-300 hidden md:inline-block">
                                {user.email}
                            </span>
                            <LogoutButton />
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
