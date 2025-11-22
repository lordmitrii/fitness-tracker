import { useTranslation } from "react-i18next";
import ActionMenu, { ActionMenuItem } from "@/src/shared/ui/ActionMenu";

interface WorkoutPlan {
  id: number | string;
  name: string;
  active?: boolean;
}

interface WorkoutPlanMenuProps {
  plan: WorkoutPlan | null;
  visible: boolean;
  onClose: () => void;
  onActivate: (plan: WorkoutPlan) => void;
  onEdit: (plan: WorkoutPlan) => void;
  onDelete: (plan: WorkoutPlan) => void;
}

export default function WorkoutPlanMenu({
  plan,
  visible,
  onClose,
  onActivate,
  onEdit,
  onDelete,
}: WorkoutPlanMenuProps) {
  const { t } = useTranslation();

  if (!plan) return null;

  const items: ActionMenuItem[] = [
    ...(!plan.active
      ? [
          {
            label: t("menus.activate_plan") || t("general.set_active") || "Set Active",
            icon: "local-fire-department" as const,
            onPress: () => onActivate(plan),
          },
        ]
      : []),
    {
      label: t("menus.update_workout_plan") || t("general.edit") || "Update Workout Plan",
      icon: "edit" as const,
      onPress: () => onEdit(plan),
    },
    {
      label: t("menus.delete_workout_plan") || t("general.delete") || "Delete Workout Plan",
      icon: "delete" as const,
      onPress: () => onDelete(plan),
      destructive: true,
    },
  ];

  return (
    <ActionMenu
      visible={visible}
      onClose={onClose}
      items={items}
    />
  );
}

