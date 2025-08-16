import api from "../../api";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "../../icons/DeleteIcon";
import { useTranslation } from "react-i18next";
import { memo, useCallback } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "../../icons/ArrowIcon";

const WorkoutCycleDetailsMenu = ({
  closeMenu,
  planID,
  cycleID,
  cycleName,
  previousCycleID,
  nextCycleID,
  setNextCycleID,
  onError,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleDeleteCycle = useCallback(() => {
    if (
      !window.confirm(
        t("menus.confirm_delete_cycle", {
          cycleName,
        })
      )
    ) {
      return;
    }
    api
      .delete(`/workout-plans/${planID}/workout-cycles/${cycleID}`)
      .then(() => {
        navigate(`/workout-plans/${planID}/workout-cycles/${previousCycleID}`);
        setNextCycleID(null);
      })
      .catch((error) => {
        console.error("Error deleting cycle:", error);
        onError(error);
      })
      .finally(() => {
        closeMenu();
      });
  }, [
    planID,
    cycleID,
    cycleName,
    previousCycleID,
    navigate,
    onError,
    setNextCycleID,
    closeMenu,
    t,
  ]);

  if (!cycleID) return null;

  return (
    <div className="flex flex-col space-y-2 mt-2">
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
          !previousCycleID ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleDeleteCycle}
        disabled={!previousCycleID}
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
