-- Dummy data for ingredients_master
insert into public.ingredients_master (name, common_name, category, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, embedding)
values
  (
    '若鶏 もも 皮なし 生',
    '鶏もも肉',
    '肉類',
    116,
    18.8,
    3.9,
    0,
    array_fill(0.1, array[1536])::vector
  ),
  (
    '若鶏 むね 皮なし 生',
    '鶏むね肉',
    '肉類',
    108,
    22.3,
    1.5,
    0,
    array_fill(0.2, array[1536])::vector
  ),
  (
    'たまねぎ 鱗茎 生',
    '玉ねぎ',
    '野菜類',
    37,
    1.0,
    0.1,
    8.8,
    array_fill(0.3, array[1536])::vector
  );
