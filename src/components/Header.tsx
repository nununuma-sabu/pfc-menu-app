import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signout } from '@/app/login/actions'

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
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600 dark:text-gray-300 hidden sm:inline-block">
                                {user.email}
                            </span>
                            <form action={signout}>
                                <button className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
                                    ログアウト
                                </button>
                            </form>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            ログイン
                        </Link>
                    )}
                </div>
            </div>
        </header>
    )
}
