"use server";

import { createClient } from "@/lib/supabase/server";
import { MealSaveData, SavedMeal } from "@/types/menu";

export async function saveMeal(mealData: MealSaveData) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return { success: false, error: "Authentication required to save menus." };
    }

    const { data, error } = await supabase
        .from("saved_menus")
        .insert({
            user_id: user.id,
            menu_data: mealData,
        })
        .select()
        .single();

    if (error) {
        console.error("Error saving menu:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function getSavedMeals(): Promise<{ success: boolean; data?: SavedMeal[]; error?: string }> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return { success: false, error: "Authentication required to get saved menus." };
    }

    const { data, error } = await supabase
        .from("saved_menus")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching saved menus:", error);
        return { success: false, error: error.message };
    }

    // Cast the jsonb menu_data to MealSaveData type
    const parsedData: SavedMeal[] = data.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        menu_data: item.menu_data as MealSaveData,
        created_at: item.created_at,
    }));

    return { success: true, data: parsedData };
}

export async function deleteSavedMeal(id: string) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return { success: false, error: "Authentication required to delete a menu." };
    }

    const { error } = await supabase
        .from("saved_menus")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error deleting saved menu:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
