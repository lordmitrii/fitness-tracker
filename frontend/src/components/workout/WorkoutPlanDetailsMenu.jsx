import api from "../../api";
import { useNavigate } from "react-router-dom";
import FlashIcon from "../../icons/FlashIcon";
import UpdateIcon from "../../icons/UpdateIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import { useTranslation } from "react-i18next";

const WorkoutPlanDetailsMenu = ({
  closeMenu,
  plan,
  onError,
  setWorkoutPlans,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleActivatePlan = () => {
    api
      .patch(`/workout-plans/${plan.id}/set-active`, { active: true })
      .then(() => {
        setWorkoutPlans((prevPlans) =>
          prevPlans.map((p) =>
            p.id === plan.id ? { ...p, active: true } : { ...p, active: false }
          )
        );
      })
      .catch((error) => {
        console.error("Error activating workout plan:", error);
        onError(error);
      })
      .finally(() => {
        closeMenu();
      });
  };

  const handleUpdatePlan = () => {
    navigate(`/update-workout-plan/${plan.id}`);
  };

  const handleDeletePlan = () => {
    if (
      !window.confirm(
        t("menus.confirm_delete_workout_plan", {
          planName: plan.name,
        })
      )
    ) {
      return;
    }
    api
      .delete(`/workout-plans/${plan.id}`)
      .then(() => {
        setWorkoutPlans((prev) => prev.filter((wp) => wp.id !== plan.id));
      })
      .catch((error) => {
        console.error("Error deleting plan:", error);
        onError(error);
      })
      .finally(() => {
        closeMenu();
      });
  };

  if (!plan) return null;

  return (
    <div className="flex flex-col space-y-2 mt-2">
      <button
        className={`btn text-left ${
          plan.active
            ? "btn-secondary-light opacity-50 cursor-not-allowed"
            : "btn-success-light"
        }`}
        disabled={plan.active}
        onClick={handleActivatePlan}
        title={
          plan.active
            ? t("menus.plan_already_active")
            : t("menus.activate_plan")
        }
      >
        <span className="flex items-center gap-2">
          <FlashIcon success={plan.active} />
          {t("menus.activate_plan")}
        </span>
      </button>
      <button
        className="btn btn-secondary-light text-left"
        onClick={handleUpdatePlan}
      >
        <span className="flex items-center gap-2">
          <UpdateIcon />
          {t("menus.update_workout_plan")}
        </span>
      </button>
      <button
        className={`btn btn-danger-light text-left`}
        onClick={handleDeletePlan}
        title={"Delete this workout plan"}
      >
        <span className="flex items-center gap-2">
          <DeleteIcon />
          {t("menus.delete_workout_plan")}
        </span>
      </button>
    </div>
  );
};

export default WorkoutPlanDetailsMenu;
