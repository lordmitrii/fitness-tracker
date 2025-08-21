import { useMemo, useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import WorkoutIcon from "../icons/WorkoutIcon";
import PlanIcon from "../icons/PlanIcon";
// import ChatIcon from "../icons/ChatIcon";
import HomeIcon from "../icons/HomeIcon";
import ProfileIcon from "../icons/ProfileIcon";
import MoreIcon from "../icons/MoreIcon";
import MoreSheet from "./more/MoreSheet";

const MenuPanel = () => {
  const { t } = useTranslation();
  const { isAuth, hasAnyRole } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const workoutPathRe = /^\/workout-plans\/[^/]+\/workout-cycles\/[^/]+\/?$/;

  const tabs = useMemo(
    () => [
      {
        to: "/",
        label: t("general.home"),
        auth: null,
        roles: [],
        icon: <HomeIcon />,
        kind: "link",
      },
      {
        to: "/workout-plans",
        label: t("general.plans"),
        end: true,
        auth: true,
        roles: [],
        icon: <PlanIcon />,
        kind: "link",
      },
      // {
      //   to: "/ai-chat",
      //   label: t("general.ai_chat"),
      //   auth: true,
      //   roles: ["admin", "member"],
      //   icon: <ChatIcon />,
      //   kind: "link",
      // },
      {
        to: "/workout-plans/?showCurrent=true",
        label: t("general.workout"),
        isActiveOverride: workoutPathRe.test(pathname),
        auth: true,
        roles: [],
        icon: <WorkoutIcon />,
        kind: "link",
      },
      {
        to: "/profile",
        label: t("general.profile"),
        auth: true,
        roles: [],
        icon: <ProfileIcon />,
        kind: "link",
      },
      {
        to: null,
        label: t("general.more"),
        auth: null,
        roles: [],
        icon: <MoreIcon />,
        kind: "more",
      },
    ],
    [t, pathname]
  );

  const visibleTabs = tabs.filter((link) => {
    if (link.auth === null) return true;
    if (!isAuth) return false;
    if (!link.roles.length) return true;
    return hasAnyRole(link.roles);
  });

  return (
    <>
      <nav className="h-[var(--menubar-height)] overflow-y-auto bg-gradient-to-r from-blue-500 to-blue-700 text-white pb-[max(env(safe-area-inset-bottom),_1rem)]">
        <ul className="flex px-1 space-x-1">
          {visibleTabs.map((link) =>
            link.kind === "link" ? (
              <li key={link.to} className="flex-1">
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => {
                    const active =
                      typeof link.isActiveOverride === "boolean"
                        ? link.isActiveOverride
                        : isActive;

                    return [
                      "flex flex-col items-center rounded-xl text-sm pt-2",
                      active ? "text-blue-300" : "text-white",
                    ].join(" ");
                  }}
                >
                  <span className="shrink-0">{link.icon}</span>
                  <span className="truncate">{link.label}</span>
                </NavLink>
              </li>
            ) : (
              <li key="more" className="flex-1">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="w-full flex flex-col items-center rounded-xl text-sm pt-2 text-white"
                >
                  <span className="">{link.icon}</span>
                  <span className="">{link.label}</span>
                </button>
              </li>
            )
          )}
        </ul>
      </nav>
      <MoreSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default MenuPanel;
