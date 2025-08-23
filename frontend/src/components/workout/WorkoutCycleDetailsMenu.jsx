import { useNavigate } from "react-router-dom";
import DeleteIcon from "../../icons/DeleteIcon";
import { useTranslation } from "react-i18next";
import { memo, useCallback } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "../../icons/ArrowIcon";
import useWorkoutData from "../../hooks/data/useWorkoutData";

const WorkoutCycleDetailsMenu = ({
  closeMenu,
  planID,
  cycleID,
  cycleName,
  previousCycleID,
  nextCycleID,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutations } = useWorkoutData({
    planID,
    cycleID,
    skipQuery: true,
  });
  const pending = !!mutations.deleteCycle.isPending;

  const handleDeleteCycle = useCallback(async () => {
    if (!previousCycleID) return;
    if (!window.confirm(t("menus.confirm_delete_cycle", { cycleName }))) return;

    navigate(
      `/workout-plans/${planID}/workout-cycles/${
        nextCycleID ?? previousCycleID
      }`,
      {
        replace: true,
      }
    );

    try {
      await mutations.deleteCycle.mutateAsync({ previousCycleID, nextCycleID });
    } catch (e) {
      console.error(e);
    } finally {
      closeMenu?.();
    }
  }, [
    navigate,
    planID,
    previousCycleID,
    nextCycleID,
    mutations.deleteCycle,
    t,
    cycleName,
    closeMenu,
  ]);

  if (!cycleID) return null;

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex gap-2 items-center justify-between">
        <div className="w-1/2">
          {!!previousCycleID && (
            <button
              className="btn btn-primary-light w-full"
              onClick={() =>
                navigate(
                  `/workout-plans/${planID}/workout-cycles/${previousCycleID}`
                )
              }
            >
              <span className="flex items-center justify-center">
                <ArrowLeftIcon />
              </span>
            </button>
          )}
        </div>
        <div className="w-1/2">
          {!!nextCycleID && (
            <button
              className="btn btn-primary-light w-full"
              onClick={() =>
                navigate(
                  `/workout-plans/${planID}/workout-cycles/${nextCycleID}`
                )
              }
            >
              <span className="flex items-center justify-center">
                <ArrowRightIcon />
              </span>
            </button>
          )}
        </div>
      </div>
      <button
        className={`btn btn-danger-light text-left  ${
          !previousCycleID || pending ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleDeleteCycle}
        disabled={!previousCycleID || pending}
        title={
          !previousCycleID
            ? t("menus.cannot_delete_first_cycle")
            : t("menus.delete_this_cycle")
        }
      >
        <span className="flex items-center gap-2">
          <DeleteIcon />
          {t("menus.delete_cycle")}
        </span>
      </button>
    </div>
  );
};

export default memo(WorkoutCycleDetailsMenu);
