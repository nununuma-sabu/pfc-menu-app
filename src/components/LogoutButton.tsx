'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LogoutButton() {
    const router = useRouter()
    const supabase = createClient()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        await supabase.auth.signOut()
        sessionStorage.removeItem("disclaimerShown")
        router.refresh()
    }

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
        >
            {isLoggingOut ? '処理中...' : 'ログアウト'}
        </button>
    )
}
