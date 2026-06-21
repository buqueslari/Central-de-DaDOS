import {
  Archive,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Circle,
  DownloadSimple,
  MagnifyingGlass,
  Pulse,
  Record,
  SpinnerGap,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "../components/AppShell";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { SubmissionDetails } from "../components/SubmissionDetails";
import { downloadCsv } from "../lib/csv";
import { previewMode } from "../lib/env";
import {
  previewSettings,
  previewStats,
  previewSubmissions,
} from "../lib/preview-data";
import { getSupabase } from "../lib/supabase";
import {
  defaultSettings,
  type FormSettings,
  type Submission,
  type SubmissionStats,
} from "../types";

const PAGE_SIZE = 10;

interface Cursor {
  createdAt: string;
  id: string;
}

const emptyStats: SubmissionStats = {
  total: 0,
  today: 0,
  thisWeek: 0,
  thisMonth: 0,
};

function toStats(value: unknown): SubmissionStats {
  const row = Array.isArray(value) ? value[0] : null;
  if (!row || typeof row !== "object") return emptyStats;
  const stats = row as Record<string, unknown>;
  return {
    total: Number(stats.total ?? 0),
    today: Number(stats.today ?? 0),
    thisWeek: Number(stats.this_week ?? 0),
    thisMonth: Number(stats.this_month ?? 0),
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

export function DashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<SubmissionStats>(emptyStats);
  const [settings, setSettings] = useState<FormSettings>(defaultSettings);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [history, setHistory] = useState<Array<Cursor | null>>([]);
  const [hasMore, setHasMore] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");

    try {
      if (previewMode) {
        const normalizedQuery = query.toLocaleLowerCase("pt-BR");
        const filtered = previewSubmissions.filter((submission) =>
          [
            submission.name,
            submission.number_16,
            submission.number_4,
            submission.number_3,
          ].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery)),
        );
        const cursorIndex = cursor
          ? filtered.findIndex((submission) => submission.id === cursor.id) + 1
          : 0;
        const rows = filtered.slice(Math.max(cursorIndex, 0), Math.max(cursorIndex, 0) + PAGE_SIZE + 1);
        setSubmissions(rows.slice(0, PAGE_SIZE));
        setHasMore(rows.length > PAGE_SIZE);
        setStats(previewStats);
        setSettings(previewSettings);
        setLoading(false);
        return;
      }

      const supabase = getSupabase();
      const [listResult, statsResult, settingsResult] = await Promise.all([
        supabase.rpc("list_submissions", {
          p_query: query || null,
          p_limit: PAGE_SIZE + 1,
          p_before_created_at: cursor?.createdAt ?? null,
          p_before_id: cursor?.id ?? null,
        }),
        supabase.rpc("get_submission_stats"),
        supabase
          .from("form_settings")
          .select(
            "form_title, success_message, name_label, number_16_label, number_4_label, number_3_label",
          )
          .eq("singleton", true)
          .single(),
      ]);

      if (listResult.error) throw listResult.error;
      if (statsResult.error) throw statsResult.error;
      if (settingsResult.error) throw settingsResult.error;

      const rows = (listResult.data ?? []) as Submission[];
      setSubmissions(rows.slice(0, PAGE_SIZE));
      setHasMore(rows.length > PAGE_SIZE);
      setStats(toStats(statsResult.data));
      setSettings(settingsResult.data as FormSettings);
    } catch (loadError) {
      console.error(loadError);
      setError("Nao foi possivel carregar os recebimentos. Verifique o Supabase e tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [cursor, query]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (previewMode) return;
    const supabase = getSupabase();
    const channel = supabase
      .channel("dashboard-submissions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        () => void loadData(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadData]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedId) ?? submissions[0] ?? null,
    [submissions, selectedId],
  );

  const metrics = [
    { label: "Total de recebimentos", value: stats.total, icon: Archive },
    { label: "Hoje", value: stats.today, icon: CalendarBlank },
    { label: "Esta semana", value: stats.thisWeek, icon: Pulse },
    { label: "Este mes", value: stats.thisMonth, icon: CalendarBlank },
  ];

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setQuery(searchInput.trim());
    setCursor(null);
    setHistory([]);
  }

  function clearSearch() {
    setSearchInput("");
    setQuery("");
    setCursor(null);
    setHistory([]);
  }

  function nextPage() {
    const last = submissions.at(-1);
    if (!last || !hasMore) return;
    setHistory((current) => [...current, cursor]);
    setCursor({ createdAt: last.created_at, id: last.id });
  }

  function previousPage() {
    setHistory((current) => {
      if (!current.length) return current;
      const next = [...current];
      setCursor(next.pop() ?? null);
      return next;
    });
  }

  async function copyValue(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setToast(`${label} copiado.`);
  }

  async function exportAll() {
    setExporting(true);
    setError("");
    try {
      if (previewMode) {
        downloadCsv(previewSubmissions, settings, "recebimentos-demo.csv");
        setToast("Arquivo CSV gerado.");
        return;
      }

      const supabase = getSupabase();
      const rows: Submission[] = [];
      let exportCursor: Cursor | null = null;

      while (rows.length < 50_000) {
        const { data, error: exportError } = await supabase.rpc("list_submissions", {
          p_query: query || null,
          p_limit: 100,
          p_before_created_at: exportCursor?.createdAt ?? null,
          p_before_id: exportCursor?.id ?? null,
        });
        if (exportError) throw exportError;
        const batch = (data ?? []) as Submission[];
        rows.push(...batch);
        if (batch.length < 100) break;
        const last = batch.at(-1);
        if (!last) break;
        exportCursor = { createdAt: last.created_at, id: last.id };
      }

      downloadCsv(rows, settings, `recebimentos-${new Date().toISOString().slice(0, 10)}.csv`);
      setToast(`${formatNumber(rows.length)} recebimentos exportados.`);
    } catch (exportError) {
      console.error(exportError);
      setError("Nao foi possivel exportar os recebimentos.");
    } finally {
      setExporting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (!previewMode) {
        const { error: deleteError } = await getSupabase()
          .from("submissions")
          .delete()
          .eq("id", deleteTarget.id);
        if (deleteError) throw deleteError;
      }
      setSubmissions((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setToast("Recebimento excluido.");
      if (!previewMode) await loadData();
    } catch (deleteError) {
      console.error(deleteError);
      setError("Nao foi possivel excluir o recebimento.");
    } finally {
      setDeleting(false);
    }
  }

  const searchForm = () => (
    <form
      className="searchbar mobile-search"
      onSubmit={submitSearch}
      role="search"
    >
      <MagnifyingGlass size={20} aria-hidden="true" />
      <input
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        placeholder="Buscar por nome ou numero"
        aria-label="Buscar recebimentos"
      />
      {searchInput && (
        <button type="button" className="icon-button" onClick={clearSearch} aria-label="Limpar busca">
          <X size={18} />
        </button>
      )}
      <button className="button search-submit" type="submit">
        <MagnifyingGlass size={17} />
        <span>Buscar</span>
      </button>
    </form>
  );

  return (
    <AppShell>
      <main className="dashboard-layout">
        <section className="dashboard-main">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FLUXO EM TEMPO REAL</span>
              <h2>Recebimentos</h2>
            </div>
            <button className="button outline-purple" onClick={() => void exportAll()} disabled={exporting}>
              {exporting ? <SpinnerGap className="spin" size={19} /> : <DownloadSimple size={19} />}
              {exporting ? "Exportando..." : "Exportar CSV"}
            </button>
          </div>

          <div className="metrics-strip">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article className="metric" key={metric.label}>
                  <span className="metric-icon"><Icon size={21} weight="duotone" /></span>
                  <div>
                    <strong>{formatNumber(metric.value)}</strong>
                    <span>{metric.label}</span>
                  </div>
                </article>
              );
            })}
          </div>

          {searchForm()}

          {error && <div className="alert error-alert">{error}</div>}

          <div className="table-frame" aria-busy={loading}>
            <table>
              <thead>
                <tr>
                  <th aria-label="Selecao" />
                  <th>{settings.name_label}</th>
                  <th>{settings.number_16_label}</th>
                  <th>{settings.number_4_label}</th>
                  <th>{settings.number_3_label}</th>
                  <th>Data de recebimento</th>
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 6 }).map((_, index) => (
                  <tr className="skeleton-row" key={index}>
                    <td><span /></td><td><span /></td><td><span /></td><td><span /></td><td><span /></td><td><span /></td>
                  </tr>
                ))}
                {!loading && submissions.map((submission) => {
                  const selected = submission.id === (selectedId ?? submissions[0]?.id);
                  return (
                    <tr
                      key={submission.id}
                      className={selected ? "is-selected" : ""}
                      onClick={() => {
                        setSelectedId(submission.id);
                        setDetailsOpen(true);
                      }}
                    >
                      <td>
                        <button
                          className="row-select-button"
                          type="button"
                          aria-label={`Ver detalhes de ${submission.name}`}
                          aria-pressed={selected}
                          onClick={() => {
                            setSelectedId(submission.id);
                            setDetailsOpen(true);
                          }}
                        >
                          {selected ? <Record size={21} weight="fill" /> : <Circle size={21} />}
                        </button>
                      </td>
                      <td><strong>{submission.name}</strong></td>
                      <td className="mono">{submission.number_16}</td>
                      <td className="mono">{submission.number_4}</td>
                      <td className="mono">{submission.number_3}</td>
                      <td className="mono date-cell">{formatDate(submission.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loading && !submissions.length && (
              <div className="empty-state">
                <Archive size={34} weight="duotone" />
                <strong>Nenhum recebimento encontrado</strong>
                <p>{query ? "Tente buscar outro nome ou numero." : "Os novos envios aparecerao aqui automaticamente."}</p>
              </div>
            )}
          </div>

          <div className="pagination">
            <span>Pagina {history.length + 1}</span>
            <div>
              <button className="icon-button" onClick={previousPage} disabled={!history.length} aria-label="Pagina anterior">
                <CaretLeft size={20} />
              </button>
              <span className="current-page">{history.length + 1}</span>
              <button className="icon-button" onClick={nextPage} disabled={!hasMore} aria-label="Proxima pagina">
                <CaretRight size={20} />
              </button>
            </div>
          </div>
        </section>

        <SubmissionDetails
          submission={selectedSubmission}
          settings={settings}
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          onCopy={(value, label) => void copyValue(value, label)}
          onDelete={setDeleteTarget}
          onExport={(submission) => {
            downloadCsv([submission], settings, `recebimento-${submission.id.slice(0, 8)}.csv`);
            setToast("Recebimento exportado.");
          }}
        />
      </main>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir este recebimento?"
        description="Esta acao remove o registro do Supabase e nao pode ser desfeita."
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      {toast && <div className="toast" role="status">{toast}</div>}
    </AppShell>
  );
}
