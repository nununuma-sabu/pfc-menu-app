import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeaderClientActions from './HeaderClientActions'

export default async function Header() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <header className="w-full border-b bg-white/80 backdrop-blur-md sticky top-0 z-50" style={{ borderColor: "var(--md-outline-variant)" }}>
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="font-bold text-xl" style={{ color: "var(--md-primary)" }}>
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
