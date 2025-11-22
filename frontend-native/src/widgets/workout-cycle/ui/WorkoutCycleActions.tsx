import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import ActionMenu, { ActionMenuItem } from "@/src/shared/ui/ActionMenu";

interface Cycle {
  id?: string | number;
  name?: string;
  previous_cycle_id?: string | number | null;
  next_cycle_id?: string | number | null;
}

interface WorkoutCycleActionsProps {
  cycle: Cycle | null;
  visible: boolean;
  planID: string | number;
  onClose: () => void;
  onDeleteCycle: (cycle: Cycle) => void;
}

export default function WorkoutCycleActions({
  cycle,
  visible,
  planID,
  onClose,
  onDeleteCycle,
}: WorkoutCycleActionsProps) {
  const { t } = useTranslation();

  if (!cycle) return null;

  const items: ActionMenuItem[] = [
    ...(cycle.previous_cycle_id
      ? [
          {
            label: t("menus.previous_cycle") || "Previous Cycle",
            icon: "arrow-back" as const,
            onPress: () => {
              router.push({
                pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
                params: {
                  planID: String(planID),
                  cycleID: String(cycle.previous_cycle_id),
                },
              });
              onClose();
            },
          },
        ]
      : []),
    ...(cycle.next_cycle_id
      ? [
          {
            label: t("menus.next_cycle") || "Next Cycle",
            icon: "arrow-forward" as const,
            onPress: () => {
              router.push({
                pathname: "/(tabs)/workout-plans/[planID]/workout-cycles/[cycleID]",
                params: {
                  planID: String(planID),
                  cycleID: String(cycle.next_cycle_id),
                },
              });
              onClose();
            },
          },
        ]
      : []),
    ...(cycle.previous_cycle_id
      ? [
          {
            label: t("menus.delete_cycle") || "Delete Cycle",
            icon: "delete" as const,
            destructive: true,
            onPress: () => {
              onDeleteCycle(cycle);
              onClose();
            },
          },
        ]
      : []),
  ];

  return (
    <ActionMenu
      visible={visible}
      onClose={onClose}
      items={items}
    />
  );
}

