import Link from 'next/link'

export default function AuthErrorPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-2">認証エラー</h1>
                <p className="text-gray-600 dark:text-gray-300">
                    ログイン処理中にエラーが発生しました。時間を置いて再度お試しください。
                </p>
            </div>
            <Link
                href="/login"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
                ログイン画面へ戻る
            </Link>
        </div>
    )
}
