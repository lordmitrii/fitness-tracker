import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import api from "../../api";
import LoadingState from "../../states/LoadingState";
import ErrorState from "../../states/ErrorState";
import { highlightMatches } from "../../utils/highlightMatches";
import Pagination from "../../components/Pagination";
import EditRolesModal from "../../modals/admin/EditRolesModal";
import DangerMenu from "../../components/admin/AdminDangerMenu";
import DropdownSelect from "../../components/DropdownSelect";
import { usePullToRefreshOverride } from "../../context/PullToRefreshContext";

const PAGE_SIZE = 20;

const Users = () => {
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("last_seen_at");
  const [sortDir, setSortDir] = useState("desc");

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 500);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/admin/roles")
      .then((res) => !cancelled && setAllRoles(res.data || []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleSaveRoles = async (newRoleNames) => {
    if (!editingUser) return;

    setSaving(true);
    setActionError(null);

    const prev = users.slice();
    const idx = users.findIndex((x) => x.id === editingUser.id);
    const nextUsers = users.slice();
    nextUsers[idx] = {
      ...editingUser,
      roles: newRoleNames.map((name) => ({ id: 0, name })),
    };

    setUsers(nextUsers);

    try {
      await api.post(`/admin/users/${editingUser.id}/roles`, {
        role_names: newRoleNames,
      });
      setEditingUser(null);
    } catch (err) {
      setUsers(prev);
      setActionError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
      loadUsers();
    }
  };

  const loadUsers = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    api
      .get("/admin/users", {
        params: {
          q: search || undefined,
          page,
          page_size: PAGE_SIZE,
          sort_by: sortBy,
          sort_dir: sortDir,
        },
      })
      .then((res) => {
        setUsers(res.data.users || []);
        setTotal(res.data.total || 0);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setFetchError(err);
      })
      .finally(() => setLoading(false));
  }, [page, search, sortBy, sortDir]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  usePullToRefreshOverride(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  if (loading) return <LoadingState />;

  if (fetchError) {
    return <ErrorState error={fetchError} onRetry={() => loadUsers()} />;
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-title">{t("admin.users.title")}</h1>

        <div className="flex items-center gap-2">
          <div className="flex sm:flex-row flex-col w-full gap-2">
            <DropdownSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                {
                  value: "last_seen_at",
                  label: t("admin.users.filter.last_seen_at"),
                },
                {
                  value: "created_at",
                  label: t("admin.users.filter.created_at"),
                },
                { value: "email", label: t("admin.users.filter.email") },
              ]}
              widthClass="w-full"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={t("admin.users.search_placeholder")}
                className="input-style"
              />
              <button
                className={`btn ${query ? "btn-primary" : "btn-secondary"}`}
                onClick={() => {
                  setQuery("");
                  setSearch("");
                  setPage(1);
                }}
                disabled={!query && !search}
              >
                {t("general.clear")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-600">
        <table className="min-w-full text-body">
          <thead className="text-left text-body uppercase tracking-wide bg-gray-50">
            <tr>
              <th className="px-4 py-3">{t("admin.table.email")}</th>
              <th className="px-4 py-3">{t("admin.table.roles")}</th>
              <th className="px-4 py-3 w-auto sm:w-40 text-right">
                {t("general.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-2 text-center text-caption">
                  {search
                    ? t("general.no_results_for", { search })
                    : t("admin.no_users")}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-gray-600 hover:bg-gray-300 transition-colors"
                >
                  <td className="px-4 py-3 align-center">
                    <div className="flex flex-col">
                      <span className="text-body max-w-[30dvh] overflow-x-auto">
                        {highlightMatches(
                          u.email,
                          query,
                          "bg-blue-600 text-white"
                        )}
                      </span>
                      {u.created_at && (
                        // <span className="text-caption">
                        //   {t("admin.table.joined_at")}:{" "}
                        //   {u.created_at
                        //     ? new Date(u.created_at).toLocaleString(
                        //         i18n.language
                        //       )
                        //     : t("general.n_a")}
                        // </span>
                        <span className="text-caption">
                          {t("admin.table.last_seen_at")}:{" "}
                          {u.last_seen_at &&
                          u.last_seen_at !== "0001-01-01T00:00:00Z"
                            ? new Date(u.last_seen_at).toLocaleString(
                                i18n.language
                              )
                            : t("general.n_a")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1 my-1">
                      {u.roles?.length ? (
                        u.roles.map((r) => (
                          <span
                            key={r.id || r.name}
                            className="px-2 py-1 rounded-xl text-caption border border-gray-400 bg-gray-100"
                          >
                            {r.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-caption">
                          {t("admin.no_roles")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-center text-right">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        className="btn btn-primary whitespace-nowrap"
                        onClick={() => {
                          setEditingUser(u);
                          setActionError(null);
                        }}
                      >
                        {t("admin.edit_roles")}
                      </button>
                      <DangerMenu
                        user={u}
                        onDone={loadUsers}
                        setError={setActionError}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageCount={pageCount}
        onPage={(p) => setPage(p)}
      />

      {!!actionError && <p className="mt-2 text-caption-red">{actionError}</p>}

      {editingUser && (
        <EditRolesModal
          user={editingUser}
          allRoles={allRoles}
          saving={saving}
          onClose={() => {
            if (saving) return;
            setEditingUser(null);
          }}
          onSave={handleSaveRoles}
        />
      )}
    </div>
  );
};

export default Users;
