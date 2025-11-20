export type Identifier = string | number;

export interface WorkoutSet extends Record<string, unknown> {
  id: Identifier;
  index: number;
  reps?: number | null;
  weight?: number | null;
  previous_weight?: number | null;
  previous_reps?: number | null;
  completed?: boolean;
  skipped?: boolean;
}

export interface WorkoutExercise extends Record<string, unknown> {
  id: Identifier;
  index: number;
  workout_sets?: WorkoutSet[];
  completed?: boolean;
  skipped?: boolean;
  estimated_calories?: number;
}

export interface Workout extends Record<string, unknown> {
  id: Identifier;
  index?: number;
  workout_exercises?: WorkoutExercise[];
  completed?: boolean;
  skipped?: boolean;
  estimated_calories?: number;
}

export interface Cycle extends Record<string, unknown> {
  id?: Identifier;
  workouts?: Workout[];
  completed?: boolean;
  skipped?: boolean;
  next_cycle_id?: Identifier | null;
  previous_cycle_id?: Identifier | null;
  __partial?: boolean;
}

export interface WorkoutPlan extends Record<string, unknown> {
  id: Identifier;
  name?: string;
  active?: boolean;
  current_cycle_id?: Identifier | null;
  updated_at?: string;
  __partial?: boolean;
}

export type Profile = Record<string, unknown>;

export interface Settings extends Record<string, unknown> {
  unit_system?: "metric" | "imperial";
  beta_opt_in?: boolean;
  email_notifications?: boolean;
}

export interface VersionEntry {
  key: string;
  version: string;
}

export interface Exercise extends Record<string, unknown> {
  id: Identifier;
  name?: string;
  muscle_group_id?: Identifier | null;
  source?: "pool" | "custom";
}

export interface MuscleGroup extends Record<string, unknown> {
  id: Identifier;
  name?: string;
}

export interface ExerciseBundle {
  exercises: Exercise[];
  poolOnlyExercises: Exercise[];
  muscleGroups: MuscleGroup[];
}

export interface ExerciseStat extends Record<string, unknown> {
  id?: Identifier;
  current_weight?: number | null;
  current_reps?: number | null;
}

