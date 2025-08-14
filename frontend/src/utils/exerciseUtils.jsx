import { ChartUpIcon, ChartDownIcon, ChartEqualIcon } from "../icons/ChartIcon";
import { BODYWEIGHT_FACTOR, e1RM } from "./exerciseStatsUtils";

const DEFAULTS = {
  // changes smaller than this % are treated as noise
  strengthTol: 0.02, // 2%
  volumeTol: 0.05, // 5%
  bodyweightFactor: BODYWEIGHT_FACTOR,
};

function safeNum(n) {
  return typeof n === "number" && isFinite(n) ? n : 0;
}

function computeE1RM(weight, reps, isBodyweight, bodyweightFactor) {
  const w = safeNum(weight) * (isBodyweight ? bodyweightFactor : 1);
  const r = safeNum(reps);
  if (w <= 0 || r <= 0) return 0;
  return e1RM(w, r);
}

function pctDelta(curr, prev) {
  if (prev <= 0 && curr > 0) return 1;
  if (prev <= 0) return 0;
  return (curr - prev) / prev;
}

export function getExerciseProgressBadge(set, opts = {}) {
  if (!set?.completed) return null;
  const {
    strengthTol = DEFAULTS.strengthTol,
    volumeTol = DEFAULTS.volumeTol,
    bodyweightFactor = DEFAULTS.bodyweightFactor,
  } = opts;

  const prevReps = safeNum(set.previous_reps);
  const prevWeight = safeNum(set.previous_weight);
  const currReps = safeNum(set.reps);
  const currWeight = safeNum(set.weight);
  const isBW = !!set.is_bodyweight;

  // compare estimated 1RM (bodyweight scaled)
  const prevE = computeE1RM(prevWeight, prevReps, isBW, bodyweightFactor);
  const currE = computeE1RM(currWeight, currReps, isBW, bodyweightFactor);
  const dE = pctDelta(currE, prevE);

  // optional PR detection if passing best_e1rm_all_time on the set (for the future)
  const isPR =
    typeof set.best_e1rm_all_time === "number" &&
    currE > set.best_e1rm_all_time * (1 + strengthTol);

  // if strength moved meaningfully
  if (Math.abs(dE) > strengthTol) {
    if (dE > 0) {
      const reason = isPR ? "New PR (e1RM↑)" : "Strength up (e1RM)";
      return (
        <ChartUpIcon
          title={`${reason}: ${(dE * 100).toFixed(1)}% vs last set`}
        />
      );
    } else {
      return (
        <ChartDownIcon
          title={`Strength down (e1RM): ${(dE * 100).toFixed(1)}% vs last set`}
        />
      );
    }
  }

  // check training volume (still useful for hypertrophy)
  const prevVol =
    prevReps * (isBW ? prevWeight * bodyweightFactor : prevWeight);
  const currVol =
    currReps * (isBW ? currWeight * bodyweightFactor : currWeight);
  const dV = pctDelta(currVol, prevVol);

  if (Math.abs(dV) > volumeTol) {
    if (dV > 0) {
      return (
        <ChartUpIcon
          title={`Volume up: ${(dV * 100).toFixed(1)}% vs last set`}
        />
      );
    } else {
      return (
        <ChartDownIcon
          title={`Volume down: ${(dV * 100).toFixed(1)}% vs last set`}
        />
      );
    }
  }

  return <ChartEqualIcon title="Maintained (within tolerance)" />;
}
