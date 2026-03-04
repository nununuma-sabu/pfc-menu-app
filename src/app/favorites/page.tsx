import { getSavedMenus } from "@/app/actions/favorites";
import FavoritesClient from "@/components/FavoritesClient";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FavoritesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { success, data, error } = await getSavedMenus();

    if (!success || !data) {
        return (
            <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <h1 className="text-3xl font-extrabold text-zinc-900">お気に入りメニュー</h1>
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                        エラーが発生しました: {error || "データの取得に失敗しました。"}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
                        お気に入りメニュー
                    </h1>
                    <p className="text-zinc-600 mt-2">
                        保存した献立の一覧です。いつでも確認して活用できます。
                    </p>
                </div>

                <FavoritesClient initialMenus={data} />
            </div>
        </main>
    );
}
