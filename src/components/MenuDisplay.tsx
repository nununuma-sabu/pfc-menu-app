import { Utensils, Moon, Sun, Sunrise } from "lucide-react";

interface Meal {
    name: string;
    calories: number;
    p: number;
    f: number;
    c: number;
    description: string;
    ingredients?: { name: string; amount: string }[];
    steps?: string[];
}

interface MenuData {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    total: {
        calories: number;
        p: number;
        f: number;
        c: number;
    };
}

interface MenuDisplayProps {
    menu: MenuData | null;
}

function MealCard({ title, meal, icon: Icon, colorClass }: { title: string; meal: Meal; icon: any; colorClass: string }) {
    return (
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md overflow-hidden border border-zinc-100 dark:border-zinc-700 hover:shadow-lg transition-shadow flex flex-col h-full">
            <div className={`p-4 ${colorClass} text-white flex items-center gap-2`}>
                <Icon className="w-5 h-5" />
                <h3 className="font-bold text-lg">{title}</h3>
            </div>
            <div className="p-4 space-y-4 flex-1 flex flex-col">
                <div>
                    <h4 className="font-bold text-xl text-zinc-900 dark:text-white mb-2">{meal.name}</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{meal.description}</p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg grid grid-cols-4 gap-2 text-center text-sm">
                    <div>
                        <div className="text-zinc-500 text-xs">Cal</div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">{meal.calories}</div>
                    </div>
                    <div>
                        <div className="text-zinc-500 text-xs">P</div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">{meal.p}g</div>
                    </div>
                    <div>
                        <div className="text-zinc-500 text-xs">F</div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">{meal.f}g</div>
                    </div>
                    <div>
                        <div className="text-zinc-500 text-xs">C</div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">{meal.c}g</div>
                    </div>
                </div>

                {/* Recipe Details */}
                {(meal.ingredients || meal.steps) && (
                    <div className="mt-auto pt-2 space-y-3">
                        {meal.ingredients && meal.ingredients.length > 0 && (
                            <div className="text-sm">
                                <h5 className="font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                                    <Utensils className="w-3 h-3" /> 材料
                                </h5>
                                <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 pl-1 space-y-0.5 text-xs">
                                    {meal.ingredients.map((ing, i) => (
                                        <li key={i}>{ing.name} <span className="text-zinc-400">({ing.amount})</span></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {meal.steps && meal.steps.length > 0 && (
                            <div className="text-sm">
                                <h5 className="font-bold text-zinc-700 dark:text-zinc-300 mb-1">調理手順</h5>
                                <ol className="list-decimal list-inside text-zinc-600 dark:text-zinc-400 pl-1 space-y-1 text-xs">
                                    {meal.steps.map((step, i) => (
                                        <li key={i}>{step}</li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MenuDisplay({ menu }: MenuDisplayProps) {
    if (!menu) return null;

    return (
        <div className="w-full max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MealCard
                    title="朝食"
                    meal={menu.breakfast}
                    icon={Sunrise}
                    colorClass="bg-orange-500"
                />
                <MealCard
                    title="昼食"
                    meal={menu.lunch}
                    icon={Sun}
                    colorClass="bg-yellow-500"
                />
                <MealCard
                    title="夕食"
                    meal={menu.dinner}
                    icon={Moon}
                    colorClass="bg-indigo-500"
                />
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4">
                <h3 className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Utensils className="w-5 h-5" />
                    合計栄養価
                </h3>
                <div className="flex gap-6 text-sm md:text-base">
                    <div><span className="text-zinc-500 mr-1">Cal:</span><span className="font-bold">{menu.total.calories}</span></div>
                    <div><span className="text-zinc-500 mr-1">P:</span><span className="font-bold">{menu.total.p}g</span></div>
                    <div><span className="text-zinc-500 mr-1">F:</span><span className="font-bold">{menu.total.f}g</span></div>
                    <div><span className="text-zinc-500 mr-1">C:</span><span className="font-bold">{menu.total.c}g</span></div>
                </div>
            </div>
        </div>
    );
}
