import { signup } from '../login/actions'
import Link from 'next/link'

export default async function SignupPage(props: { searchParams: Promise<{ message?: string, error?: string }> }) {
    const searchParams = await props.searchParams

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">新規登録</h1>

                {searchParams?.message && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm text-center">
                        {searchParams.message}
                    </div>
                )}
                {searchParams?.error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm text-center">
                        {searchParams.error}
                    </div>
                )}

                <form className="flex flex-col gap-4">
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
                        formAction={signup}
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors"
                    >
                        新規登録
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    すでにアカウントをお持ちですか？{' '}
                    <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400 font-medium">
                        ログイン
                    </Link>
                </div>
            </div>
        </div>
    )
}
