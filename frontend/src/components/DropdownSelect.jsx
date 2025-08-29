import { useEffect, useRef, useState } from "react";
import ChevronIcon from "../icons/ChevronIcon";

function DropdownSelect({
  value,
  onChange,
  options = [],
  disabled = false,
  widthClass = "w-36",
  menuWidth,
  renderButton,
  renderButtonLabel,
  showChevron = true,
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const idRef = useRef(`sel_${Math.random().toString(36).slice(2)}`);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const selected = options[selectedIndex] ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e) => {
      if (
        listRef.current &&
        !listRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [open]);

  const commonButtonProps = {
    ref: btnRef,
    type: "button",
    onClick: () => !disabled && setOpen((v) => !v),
    disabled,
  };

  return (
    <div className={`relative`}>
      {renderButton ? (
        renderButton({
          buttonProps: commonButtonProps,
          open,
          disabled,
          selected,
        })
      ) : (
        <div className={widthClass}>
          <button
            {...commonButtonProps}
            className={[
              "flex items-center justify-between gap-2",
              "input-style",
              disabled ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {renderButtonLabel ? (
              renderButtonLabel(selected)
            ) : (
              <span className="truncate text-body">
                {selected?.label ?? ""}
              </span>
            )}
            {showChevron && (
              <ChevronIcon
                className={"text-body"}
                direction={open ? "up" : "down"}
              />
            )}
          </button>
        </div>
      )}

      {open && (
        <ul
          ref={listRef}
          id={idRef.current}
          tabIndex={-1}
          className={[
            "absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50",
            "bg-white border border-gray-700",
            "rounded-lg shadow-lg space-y-1 p-1 animate-fade-in",
            menuWidth ? menuWidth : widthClass,
          ].join(" ")}
        >
          {options.map((opt, idx) => {
            const isSelected = value === opt.value;
            return (
              <li key={opt.value} id={`${idRef.current}_opt_${idx}`}>
                <button
                  type="button"
                  tabIndex={0}
                  className={[
                    "w-full text-left px-2 py-2 rounded-lg transition",
                    isSelected
                      ? "bg-gray-500 text-gray-200 font-bold"
                      : "hover:bg-gray-50 text-gray-600 font-bold",
                  ].join(" ")}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    btnRef.current?.focus();
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default DropdownSelect;
