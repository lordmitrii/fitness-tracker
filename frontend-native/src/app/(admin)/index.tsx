import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";

import { AdminSectionsList } from "@/src/widgets/admin-index";
import { useAdminSections } from "@/src/features/admin/index-sections";

export default function AdminScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const sections = useAdminSections();

  const handleSectionPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("admin.title_main") || "Admin Panel",
        })}
      />
      <AdminSectionsList
        sections={sections}
        onSectionPress={handleSectionPress}
      />
    </>
  );
}
