import MoreContent from "./MoreContent";

const MoreAside = () => {
  return (
    <aside className="hidden sm:flex sm:w-[var(--menubar-width)] sm:flex-shrink-0 sm:border-r border-gray-200">
      <div className="h-full w-full overflow-y-auto">
        <MoreContent variant="aside" />
      </div>
    </aside>
  );
};

export default MoreAside;
