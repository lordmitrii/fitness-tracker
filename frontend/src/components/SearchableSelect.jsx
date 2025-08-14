import {
  useState,
  useMemo,
  useDeferredValue,
  useRef,
  useCallback,
  useEffect,
  memo,
} from "react";
import useOutsidePointerClose from "../hooks/useOutsidePointerClose";
import { highlightMatches } from "../utils/highlightMatches";

const SearchableSelect = ({
  items,
  valueLabel,
  placeholder,
  required = false,
  maxItems = 200,

  getKey,
  getLabel,
  getLabelLower,

  filterPredicate,

  onSelect,

  openKey,
  openWhich,
  setOpenWhich,

  t,
  showClearRow = false,
  clearRowLabel,

  listId,
}) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const isOpen = openWhich === openKey;
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const qLower = deferredQuery.trim().toLowerCase();

  const preventBlur = useCallback((e) => e.preventDefault(), []);

  useOutsidePointerClose(containerRef, () => setOpenWhich("none"), {
    disabled: !isOpen,
    touchTapMovementThreshold: 6,
  });

  const filteredItems = useMemo(() => {
    const base = items || [];
    if (!qLower) return base.slice(0, maxItems);

    const pred =
      filterPredicate ||
      ((item, q) => {
        const lower = getLabelLower
          ? getLabelLower(item)
          : getLabel(item).toLowerCase();
        return lower.includes(q);
      });

    const out = [];
    for (let i = 0; i < base.length && out.length < maxItems; i++) {
      if (pred(base[i], qLower)) out.push(base[i]);
    }
    return out;
  }, [items, qLower, getLabel, getLabelLower, filterPredicate, maxItems]);

  const commit = useCallback(
    (item) => {
      if (!item && !required) {
        onSelect(null);
        setQuery("");
        setOpenWhich("none");
        inputRef.current?.blur();
        return;
      }
      if (!item) return;
      onSelect(item);
      setQuery("");
      setOpenWhich("none");
      inputRef.current?.blur();
    },
    [onSelect, required, setOpenWhich]
  );

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        spellCheck="false"
        className="input-style"
        type="text"
        value={isOpen ? query : valueLabel || ""}
        onFocus={() => setOpenWhich(openKey)}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setOpenWhich(openKey);
          if (!required && v.trim() === "" && showClearRow) {
            onSelect(null);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
      />

      {isOpen && (
        <ul
          id={listId}
          className="absolute z-20 mt-1 max-h-[50dvh] w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
          style={{ touchAction: "pan-y" }}
        >
          {showClearRow && (
            <li
              key="__clear__"
              className="px-3 py-2 cursor-pointer text-body italic hover:bg-gray-100 active:bg-gray-100"
              onMouseDown={preventBlur}
              onClick={() => commit(null)}
            >
              {clearRowLabel}
            </li>
          )}

          {filteredItems.length === 0 ? (
            <li className="px-3 py-2 text-gray-400 text-caption">
              {t?.("general.no_results_for", { search: query }) ?? "No results"}
            </li>
          ) : (
            filteredItems.map((item, idx) => {
              const label = getLabel(item);
              return (
                <li
                  key={getKey(item)}
                  id={`${listId}-opt-${idx}`}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 active:bg-gray-100 text-body"
                  onMouseDown={preventBlur}
                  onClick={() => commit(item)}
                >
                  {highlightMatches(label, qLower, "bg-blue-600 text-white")}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};

export default memo(SearchableSelect);
