import { useTranslation } from "react-i18next";
import ActionMenu, { ActionMenuItem } from "@/src/shared/ui/ActionMenu";

interface Workout {
  id: string | number;
  name?: string;
}

interface WorkoutMenuProps {
  workout: Workout | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (workout: Workout) => void;
  onDelete: (workout: Workout) => void;
}

export default function WorkoutMenu({
  workout,
  visible,
  onClose,
  onEdit,
  onDelete,
}: WorkoutMenuProps) {
  const { t } = useTranslation();

  if (!workout) return null;

  const items: ActionMenuItem[] = [
    {
      label: t("menus.update_workout") || t("general.edit") || "Update Workout",
      icon: "edit" as const,
      onPress: () => onEdit(workout),
    },
    {
      label: t("menus.delete_workout") || t("general.delete") || "Delete Workout",
      icon: "delete" as const,
      onPress: () => onDelete(workout),
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

