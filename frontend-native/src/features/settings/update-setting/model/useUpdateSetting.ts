import { useCallback } from "react";

interface UseUpdateSettingParams {
  updateSettingMutation: (key: string, value: any) => void;
}

export function useUpdateSetting({
  updateSettingMutation,
}: UseUpdateSettingParams) {
  const updateSetting = useCallback(
    (key: string, value: any) => {
      updateSettingMutation(key, value);
    },
    [updateSettingMutation]
  );

  return { updateSetting };
}

