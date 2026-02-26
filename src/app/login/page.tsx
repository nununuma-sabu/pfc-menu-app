'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()
    const [errorMsg, setErrorMsg] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrorMsg('')
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setErrorMsg('ログインに失敗しました。メールアドレスまたはパスワードが間違っています。')
            setIsLoading(false)
        } else {
            router.push('/')
            router.push('/')
            router.refresh()
        }
    }

    const handleGuestLogin = async () => {
        setErrorMsg('')
        setIsLoading(true)

        // ポートフォリオ確認用テストアカウント（Supabase上で事前作成が必要）
        const email = 'guest@example.com'
        const password = 'guest-password-pfc'

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setErrorMsg('ゲストログインに失敗しました。管理者がアカウントを準備中かもしれません。')
            setIsLoading(false)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">ログイン</h1>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm text-center">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">メールアドレス</label>
                        <input
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            id="email"
                            name="email"
                            type="email"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">パスワード</label>
                        <input
                            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            id="password"
                            name="password"
                            type="password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'ログイン中...' : 'ログイン'}
                        {isLoading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>

                <div className="mt-5 flex items-center justify-center space-x-2">
                    <span className="h-px w-full bg-gray-200 dark:bg-gray-700"></span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium px-2 whitespace-nowrap">または</span>
                    <span className="h-px w-full bg-gray-200 dark:bg-gray-700"></span>
                </div>

                <div className="mt-5">
                    <button
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                        type="button"
                        className="w-full bg-slate-50 dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-gray-600 dark:hover:border-gray-500 text-slate-700 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-colors outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                    >
                        ポートフォリオ確認用（ゲストログイン）
                    </button>
                </div>

                <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    アカウントをお持ちでないですか？{' '}
                    <Link href="/signup" className="text-blue-600 hover:underline dark:text-blue-400 font-medium">
                        新規登録
                    </Link>
                </div>
            </div>
        </div>
    )
}
