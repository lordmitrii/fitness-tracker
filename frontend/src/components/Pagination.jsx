import { useTranslation } from "react-i18next";

const Pagination = ({ page, pageCount, onPage }) => {
  const { t } = useTranslation();
  const prev = () => onPage(Math.max(1, page - 1));
  const next = () => onPage(Math.min(pageCount, page + 1));

  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-caption">
        {t("general.pagination.page_of", { page, pageCount })}
      </span>
      <div className="flex gap-2">
        <button
          className={`btn ${page <= 1 ? "btn-secondary" : "btn-primary"}`}
          onClick={prev}
          disabled={page <= 1}
        >
          {t("general.prev")}
        </button>
        <button
          className={`btn ${
            page >= pageCount ? "btn-secondary" : "btn-primary"
          }`}
          onClick={next}
          disabled={page >= pageCount}
        >
          {t("general.next")}
        </button>
      </div>
    </div>
  );
};

export default Pagination;
