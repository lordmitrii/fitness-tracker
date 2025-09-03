import { useNavigate } from "react-router-dom";
import FlashIcon from "../../icons/FlashIcon";
import UpdateIcon from "../../icons/UpdateIcon";
import DeleteIcon from "../../icons/DeleteIcon";
import { useTranslation } from "react-i18next";
import usePlansData from "../../hooks/data/usePlansData";

const WorkoutPlanDetailsMenu = ({ closeMenu, plan }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { mutations } = usePlansData({ skipQuery: true });
  const handleActivatePlan = async () => {
    try {
      await mutations.activatePlan.mutateAsync({ planID: plan.id });
    } catch (error) {
      console.error(error);
    } finally {
      closeMenu();
    }
  };

  const handleUpdatePlan = () => {
    navigate(`/update-workout-plan/${plan.id}`, { state: { plan } });
  };

  const handleDeletePlan = async () => {
    if (
      !window.confirm(
        t("menus.confirm_delete_workout_plan", {
          planName: plan.name,
        })
      )
    ) {
      return;
    }
    try {
      await mutations.deletePlan.mutateAsync({ planID: plan.id });
    } catch (error) {
      console.error(error);
    } finally {
      closeMenu();
    }
  };

  if (!plan) return null;

  return (
    <div className="flex flex-col space-y-2">
      {!plan.active && (
        <button
          className={`btn text-left btn-success-light`}
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
      )}
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
