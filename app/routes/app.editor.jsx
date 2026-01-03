import React, { useState, useEffect } from "react";
import { useSubmit, useLoaderData } from "react-router";
import { Star, RotateCcw, Box, Settings2, Palette, Layout as LayoutIcon, ImageIcon, Video } from "lucide-react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

const defaultConfig = {
  primaryColor: "#4A90E2",
  secondaryColor: "#64748b",
  starColor: "#fbbf24",
  buttonColor: "#008060",
  showPhotos: true,
  showVideos: true,
  showRatings: true,
  borderRadius: 12,
  shadowDepth: 4,
  fontSize: 14,
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.settings.findUnique({ where: { shop: session.shop } });
  return { savedConfig: settings ? JSON.parse(settings.config) : defaultConfig };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const config = formData.get("config");

  await db.settings.upsert({
    where: { shop: session.shop },
    update: { config },
    create: { shop: session.shop, config },
  });

  return { ok: true }; // Plain object return works in RR7
};

export default function Editor() {
  const { savedConfig } = useLoaderData();
  const [config, setConfig] = useState(savedConfig);
  const [saved, setSaved] = useState(false);
  const submit = useSubmit();

  const updateConfig = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  const saveConfig = () => {
    submit({ config: JSON.stringify(config) }, { method: "POST" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const styles = {
    container: { display: "flex", height: "100vh", backgroundColor: "#f8fafc", fontFamily: "sans-serif" },
    sidebar: { width: "380px", backgroundColor: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" },
    main: { flex: 1, padding: "60px", display: "flex", justifyContent: "center", alignItems: "flex-start", backgroundColor: "#f1f5f9", overflowY: "auto" },
    formCard: {
      width: "100%", maxWidth: "640px", backgroundColor: "#fff",
      borderRadius: `${config.borderRadius}px`,
      boxShadow: `0 ${config.shadowDepth}px ${config.shadowDepth * 4}px rgba(0,0,0,0.1)`,
      fontSize: `${config.fontSize}px`, padding: "40px", border: "1px solid #e2e8f0"
    },
    input: { width: "100%", padding: "12px", borderRadius: `${config.borderRadius / 2}px`, border: "1px solid #e2e8f0", marginTop: "8px" }
  };

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", fontWeight: "bold" }}>Widget Editor</div>
        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
            <SideSection title="Colors" icon={<Palette size={16}/>}>
                <ColorInput label="Accent" value={config.primaryColor} onChange={(v) => updateConfig("primaryColor", v)} />
                <ColorInput label="Stars" value={config.starColor} onChange={(v) => updateConfig("starColor", v)} />
                <ColorInput label="Button" value={config.buttonColor} onChange={(v) => updateConfig("buttonColor", v)} />
            </SideSection>
            <SideSection title="Visuals" icon={<Box size={16}/>}>
                <Slider label="Radius" min={0} max={40} value={config.borderRadius} onChange={(v) => updateConfig("borderRadius", v)} />
                <Slider label="Shadow" min={0} max={20} value={config.shadowDepth} onChange={(v) => updateConfig("shadowDepth", v)} />
            </SideSection>
        </div>
        <div style={{ padding: "24px", borderTop: "1px solid #f1f5f9" }}>
          <button onClick={saveConfig} style={{ width: "100%", padding: "12px", backgroundColor: saved ? "#10b981" : "#008060", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            {saved ? "Saved to Storefront" : "Save Changes"}
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.formCard}>
          <div style={{ textAlign: "center" }}>
            <Star size={40} fill={config.starColor} stroke={config.starColor} />
            <h2 style={{ color: config.secondaryColor }}>Write a Review</h2>
          </div>
          <input placeholder="Name" style={styles.input} />
          <textarea placeholder="Comment" style={{ ...styles.input, height: "100px" }} />
          <button style={{ marginTop: "20px", width: "100%", padding: "12px", backgroundColor: config.buttonColor, color: "#fff", border: "none", borderRadius: `${config.borderRadius / 2}px` }}>Submit</button>
        </div>
      </main>
    </div>
  );
}

// Helpers
function SideSection({ title, icon, children }) { return <div style={{ marginBottom: "20px" }}><div style={{ display: "flex", gap: "8px", fontSize: "12px", fontWeight: "bold", color: "#94a3b8", marginBottom: "10px" }}>{icon} {title}</div>{children}</div>; }
function ColorInput({ label, value, onChange }) { return <div style={{ marginBottom: "10px" }}><label style={{ fontSize: "11px" }}>{label}</label><input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ display: "block", width: "100%" }} /></div>; }
function Slider({ label, min, max, value, onChange }) { return <div style={{ marginBottom: "10px" }}><label style={{ fontSize: "11px" }}>{label} ({value}px)</label><input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} style={{ width: "100%" }} /></div>; }