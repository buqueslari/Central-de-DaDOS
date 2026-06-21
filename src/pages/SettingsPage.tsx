import {
  CheckCircle,
  FloppyDisk,
  SlidersHorizontal,
  SpinnerGap,
} from "@phosphor-icons/react";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../components/AppShell";
import { previewMode } from "../lib/env";
import { previewSettings } from "../lib/preview-data";
import { getSupabase } from "../lib/supabase";
import { defaultSettings, type FormSettings } from "../types";

const fields: Array<{ key: keyof FormSettings; label: string; maxLength: number }> = [
  { key: "form_title", label: "Titulo do formulario", maxLength: 120 },
  { key: "success_message", label: "Mensagem de sucesso", maxLength: 240 },
  { key: "name_label", label: "Rotulo do nome", maxLength: 80 },
  { key: "number_16_label", label: "Rotulo dos 16 digitos", maxLength: 80 },
  { key: "number_4_label", label: "Rotulo dos 4 digitos", maxLength: 80 },
  { key: "number_3_label", label: "Rotulo dos 3 digitos", maxLength: 80 },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<FormSettings>(
    previewMode ? previewSettings : defaultSettings,
  );
  const [loading, setLoading] = useState(!previewMode);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (previewMode) {
      return;
    }

    void getSupabase()
      .from("form_settings")
      .select(
        "form_title, success_message, name_label, number_16_label, number_4_label, number_3_label",
      )
      .eq("singleton", true)
      .single()
      .then(({ data, error: loadError }) => {
        if (loadError) setError("Nao foi possivel carregar as configuracoes.");
        if (data) setSettings(data as FormSettings);
        setLoading(false);
      });
  }, []);

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const hasEmptyValue = Object.values(settings).some((value) => !value.trim());
      if (hasEmptyValue) throw new Error("Preencha todos os textos.");

      if (!previewMode) {
        const { error: saveError } = await getSupabase()
          .from("form_settings")
          .update(settings)
          .eq("singleton", true);
        if (saveError) throw saveError;
      }

      setMessage(previewMode ? "Alteracoes simuladas no modo demo." : "Configuracoes atualizadas.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nao foi possivel salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <main className="settings-page">
        <div className="section-heading settings-heading">
          <div>
            <span className="eyebrow">CONTROLE DO FORMULARIO</span>
            <h2>Configuracoes</h2>
            <p>Defina os textos que o seu frontend pode buscar pela rota <span className="mono">/api/form-config</span>.</p>
          </div>
          <span className="settings-icon"><SlidersHorizontal size={25} weight="duotone" /></span>
        </div>

        <form className="settings-form" onSubmit={saveSettings}>
          <div className="settings-grid">
            {fields.map((field) => (
              <label key={field.key}>
                <span>{field.label}</span>
                <input
                  value={settings[field.key]}
                  aria-label={field.label}
                  maxLength={field.maxLength}
                  disabled={loading || saving}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
                <small>{settings[field.key].length}/{field.maxLength}</small>
              </label>
            ))}
          </div>

          {error && <div className="alert error-alert">{error}</div>}
          {message && <div className="alert success-alert"><CheckCircle size={19} weight="fill" />{message}</div>}

          <div className="settings-actions">
            <button className="button primary" disabled={loading || saving}>
              {saving ? <SpinnerGap className="spin" size={19} /> : <FloppyDisk size={19} />}
              {saving ? "Salvando..." : "Salvar configuracoes"}
            </button>
          </div>
        </form>

        <section className="security-note">
          <pre><code>{`GET /api/form-config
200 OK
cache-control: s-maxage=60

// A service_role nunca e enviada ao navegador.`}</code></pre>
        </section>
      </main>
    </AppShell>
  );
}
