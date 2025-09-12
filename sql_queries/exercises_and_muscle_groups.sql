BEGIN;

INSERT INTO public.muscle_groups (name, slug) VALUES
  ('Chest', 'chest'),
  ('Back', 'back'),
  ('Shoulders', 'shoulders'),
  ('Biceps', 'biceps'),
  ('Triceps', 'triceps'),
  ('Quads', 'quads'),
  ('Hamstrings', 'hamstrings'),
  ('Glutes', 'glutes'),
  ('Abs', 'abs'),
  ('Calves', 'calves'),
  ('Forearms', 'forearms'),
  ('Traps', 'traps')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;  

INSERT INTO public.exercises (name, is_bodyweight, muscle_group_id, slug, is_time_based)
SELECT v.name, v.is_bodyweight, mg.id, v.slug, v.is_time_based
FROM (
  VALUES
    -- Chest
    ('Bench Press', false, 'chest', 'bench-press', false),
    ('Incline Bench Press', false, 'chest', 'incline-bench-press', false),
    ('Incline Dumbbell Press', false, 'chest', 'incline-dumbbell-press', false),
    ('Dumbbell Flyes', false, 'chest', 'dumbbell-flyes', false),
    ('Cable Crossovers', false, 'chest', 'cable-crossovers', false),
    ('Chest Press Machine', false, 'chest', 'chest-press-machine', false),
    ('Pec Deck', false, 'chest', 'pec-deck', false),
    ('Push-Ups', true, 'chest', 'push-ups', false),
    ('Chest Dips', true, 'chest', 'chest-dips', false),
    ('Cable Flyes', false, 'chest', 'cable-flyes', false),
    ('Incline Cable Flyes', false, 'chest', 'incline-cable-flyes', false),
    ('Dumbbell Bench Press', false, 'chest', 'dumbbell-bench-press', false),
    ('Smith Machine Bench Press', false, 'chest', 'smith-machine-bench-press', false),
    ('Incline Smith Machine Press', false, 'chest', 'incline-smith-machine-press', false),

    -- Back
    ('Barbell Rows', false, 'back', 'barbell-rows', false),
    ('Pull-Ups', true, 'back', 'pull-ups', false),
    ('Chin-Ups', true, 'back', 'chin-ups', false),
    ('Lat Pulldowns', false, 'back', 'lat-pulldowns', false),
    ('Pullovers', false, 'back', 'pullovers', false),
    ('Narrow Grip Seated Cable Rows', false, 'back', 'narrow-grip-seated-cable-rows', false),
    ('T-Bar Rows', false, 'back', 't-bar-rows', false),
    ('Single Arm Dumbbell Rows', false, 'back', 'single-arm-dumbbell-rows', false),
    ('Single Arm Lat Pulldowns', false, 'back', 'single-arm-lat-pulldowns', false),
    ('Machine Horizontal Rows', false, 'back', 'machine-horizontal-rows', false),
    ('Single Arm Cable Rows', false, 'back', 'single-arm-cable-rows', false),
    ('Wide Grip Seated Cable Rows', false, 'back', 'wide-grip-seated-cable-rows', false),
    ('Seated Machine Rows', false, 'back', 'seated-machine-rows', false),

    -- Shoulders
    ('Overhead Press', false, 'shoulders', 'overhead-press', false),
    ('Dumbbell Lateral Raises', false, 'shoulders', 'dumbbell-lateral-raises', false),
    ('Front Raises', false, 'shoulders', 'front-raises', false),
    ('Rear Delt Flyes', false, 'shoulders', 'rear-delt-flyes', false),
    ('Arnold Press', false, 'shoulders', 'arnold-press', false),
    ('Dumbbell Shoulder Press', false, 'shoulders', 'dumbbell-shoulder-press', false),
    ('Cable Lateral Raises', false, 'shoulders', 'cable-lateral-raises', false),
    ('Face Pulls', false, 'shoulders', 'face-pulls', false),
    ('Upright Rows', false, 'shoulders', 'upright-rows', false),
    ('Delts Machine', false, 'shoulders', 'delts-machine', false),

    -- Biceps
    ('Barbell Curls', false, 'biceps', 'barbell-curls', false),
    ('Hammer Curls', false, 'biceps', 'hammer-curls', false),
    ('Preacher Curls', false, 'biceps', 'preacher-curls', false),
    ('Concentration Curls', false, 'biceps', 'concentration-curls', false),
    ('Cable Curls', false, 'biceps', 'cable-curls', false),
    ('Incline Dumbbell Curls', false, 'biceps', 'incline-dumbbell-curls', false),
    ('Zottman Curls', false, 'biceps', 'zottman-curls', false),
    ('Bayesian Curls', false, 'biceps', 'bayesian-curls', false),
    ('EZ Bar Curls', false, 'biceps', 'ez-bar-curls', false),
    ('Dumbbell Curls', false, 'biceps', 'dumbbell-curls', false),
    ('Machine Preacher Curls', false, 'biceps', 'machine-preacher-curls', false),

    -- Triceps
    ('Pushdowns', false, 'triceps', 'tricep-pushdowns', false),
    ('Overhead Tricep Extensions', false, 'triceps', 'overhead-tricep-extensions', false),
    ('Skullcrusher', false, 'triceps', 'skullcrusher', false),
    ('Dips', true, 'triceps', 'dips', false),
    ('Close-Grip Bench Press', false, 'triceps', 'close-grip-bench-press', false),
    ('Tricep Kickbacks', false, 'triceps', 'tricep-kickbacks', false),
    ('Diamond Push-Ups', true, 'triceps', 'diamond-push-ups', false),
    ('Cable Rope Pushdowns', false, 'triceps', 'cable-rope-pushdowns', false),

    -- Quads
    ('Squats', false, 'quads', 'squats', false),
    ('Leg Press', false, 'quads', 'leg-press', false),
    ('Bulgarian Split Squats', false, 'quads', 'bulgarian-split-squats', false),
    ('Front Squats', false, 'quads', 'front-squats', false),
    ('Leg Press Machine', false, 'quads', 'leg-press-machine', false),
    ('Step-Ups', true, 'quads', 'step-ups', false),
    ('Leg Extensions', false, 'quads', 'leg-extensions', false),
    ('Smith Machine Squats', false, 'quads', 'smith-machine-squats', false),
    ('Goblet Squats', false, 'quads', 'goblet-squats', false),
    ('Hack Squats', false, 'quads', 'hack-squats', false),
    ('Sissy Squats', true, 'quads', 'sissy-squats', false),
    ('Adductor Machine', false, 'quads', 'adductor-machine', false),

    -- Hamstrings
    ('Deadlift', false, 'hamstrings', 'deadlift', false),
    ('Romanian Deadlift', false, 'hamstrings', 'romanian-deadlift', false),
    ('Seated Leg Curls', false, 'hamstrings', 'seated-leg-curls', false),
    ('Lying Leg Curls', false, 'hamstrings', 'lying-leg-curls', false),
    ('Glute-Ham Raises', false, 'hamstrings', 'glute-ham-raises', false),
    ('Good Mornings', false, 'hamstrings', 'good-mornings', false),
    ('Kettlebell Swings', false, 'hamstrings', 'kettlebell-swings', false),
    ('Nordic Curls', false, 'hamstrings', 'nordic-curls', false),
    ('Stiff-Legged Deadlifts', false, 'hamstrings', 'stiff-legged-deadlifts', false),

    -- Glutes
    ('Hip Thrusts', false, 'glutes', 'hip-thrusts', false),
    ('Glute Bridges', false, 'glutes', 'glute-bridges', false),
    ('Cable Kickbacks', false, 'glutes', 'cable-kickbacks', false),
    ('Lunges', false, 'glutes', 'lunges', false),
    ('Abductor Machine', false, 'glutes', 'abductor-machine', false),

    -- Abs
    ('Crunches', true, 'abs', 'crunches', false),
    ('Hanging Leg Raises', true, 'abs', 'hanging-leg-raises', false),
    ('Plank', true, 'abs', 'plank', true),
    ('Cable Crunches', false, 'abs', 'cable-crunches', false),
    ('Russian Twists', true, 'abs', 'russian-twists', false),
    ('Decline Crunches', true, 'abs', 'decline-crunches', false),

    -- Calves
    ('Machine Calf Raises', false, 'calves', 'calf-raises', false),
    ('Standing Calf Raises', true, 'calves', 'standing-calf-raises', false),
    ('Smith Machine Calf Raises', false, 'calves', 'smith-machine-calf-raises', false),

    -- Forearms
    ('Wrist Curls', false, 'forearms', 'wrist-curls', false),
    ('Reverse Curls', false, 'forearms', 'reverse-curls', false),

    -- Traps
    ('Dumbbell Shrugs', false, 'traps', 'dumbbell-shrugs', false),
    ('Farmer''s Walk', false, 'traps', 'farmers-walk', false)
) AS v(name, is_bodyweight, mg_slug, slug, is_time_based)
JOIN public.muscle_groups mg ON mg.slug = v.mg_slug
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  is_bodyweight = EXCLUDED.is_bodyweight,
  muscle_group_id = EXCLUDED.muscle_group_id,
  is_time_based = EXCLUDED.is_time_based;

COMMIT;
