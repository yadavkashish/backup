import React, { useState, useEffect } from "react";
import {
  Star,
  X,
  RotateCcw,
  Box,
  Settings2,
  Palette,
  Layout as LayoutIcon,
  CheckCircle2,
  Image as ImageIcon,
  Video
} from "lucide-react";

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

export default function App() {
  const [config, setConfig] = useState(defaultConfig);
  const [saved, setSaved] = useState(false);
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < 768;

  useEffect(() => {
    const savedConfig = localStorage.getItem("reviewWidgetConfig");
    if (savedConfig) {
      try { setConfig(JSON.parse(savedConfig)); } catch (e) { console.error(e); }
    }
  }, []);

  const updateConfig = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));
  const saveConfig = () => {
    localStorage.setItem("reviewWidgetConfig", JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  const resetConfig = () => setConfig(defaultConfig);

  // Dynamic Styles
  const styles = {
    container: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      height: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: config.secondaryColor, // Apply Text Color here
      overflow: "hidden",
    },
    sidebar: {
      width: isMobile ? "100%" : "380px",
      backgroundColor: "#ffffff",
      borderRight: isMobile ? "none" : "1px solid #e2e8f0",
      display: "flex",
      flexDirection: "column",
      zIndex: 20,
    },
    main: {
      flex: 1,
      overflowY: "auto",
      padding: isMobile ? "20px" : "60px",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      backgroundColor: "#f1f5f9",
    },
    formCard: {
      width: "100%",
      maxWidth: "640px",
      backgroundColor: "#ffffff",
      borderRadius: `${config.borderRadius}px`,
      // Improved shadow logic
      boxShadow: `0 ${config.shadowDepth}px ${config.shadowDepth * 4}px rgba(0,0,0,${config.shadowDepth * 0.02 + 0.05})`,
      fontSize: `${config.fontSize}px`,
      overflow: "hidden",
      border: "1px solid #e2e8f0",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: `${config.borderRadius / 1.5}px`, // Responsive Radius
      border: `1px solid #e2e8f0`,
      fontSize: "inherit",
      outline: "none",
      marginTop: "6px",
      boxSizing: "border-box",
      color: config.secondaryColor,
    },
    uploadBox: {
      flex: 1,
      border: "2px dashed #e2e8f0",
      borderRadius: `${config.borderRadius / 1.2}px`, // Respects Radius config
      padding: "20px",
      textAlign: "center",
      backgroundColor: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
    }
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "12px" }}>
          <Settings2 size={24} color={config.primaryColor} />
          <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Widget Editor</h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <SideSection title="Visibility" icon={<LayoutIcon size={16} />}>
            <Toggle label="Photos" active={config.showPhotos} onClick={() => updateConfig("showPhotos", !config.showPhotos)} />
            <Toggle label="Videos" active={config.showVideos} onClick={() => updateConfig("showVideos", !config.showVideos)} />
            <Toggle label="Ratings" active={config.showRatings} onClick={() => updateConfig("showRatings", !config.showRatings)} />
          </SideSection>

          <SideSection title="Colors" icon={<Palette size={16} />}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <ColorInput label="Accent" value={config.primaryColor} onChange={(v) => updateConfig("primaryColor", v)} />
              <ColorInput label="Stars" value={config.starColor} onChange={(v) => updateConfig("starColor", v)} />
              <ColorInput label="Button" value={config.buttonColor} onChange={(v) => updateConfig("buttonColor", v)} />
              <ColorInput label="Text" value={config.secondaryColor} onChange={(v) => updateConfig("secondaryColor", v)} />
            </div>
          </SideSection>

          <SideSection title="Visuals" icon={<Box size={16} />}>
            <Slider label="Radius" min={0} max={40} value={config.borderRadius} onChange={(v) => updateConfig("borderRadius", v)} />
            <Slider label="Shadow" min={0} max={30} value={config.shadowDepth} onChange={(v) => updateConfig("shadowDepth", v)} />
            <Slider label="Size" min={12} max={18} value={config.fontSize} onChange={(v) => updateConfig("fontSize", v)} />
          </SideSection>
        </div>

        <div style={{ padding: "24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "12px" }}>
          <button onClick={resetConfig} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", cursor: "pointer" }}><RotateCcw size={16} /></button>
          <button onClick={saveConfig} style={{ flex: 2, padding: "12px", backgroundColor: saved ? "#10b981" : "#008060", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}>
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </aside>

      {/* PREVIEW */}
      <main style={styles.main}>
        <div style={styles.formCard}>
          <div style={{ padding: isMobile ? "24px" : "40px" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <Star size={40} fill={config.starColor} stroke={config.starColor} style={{ marginBottom: "12px" }} />
              <h1 style={{ fontSize: "24px", fontWeight: "800", color: config.secondaryColor }}>Write a Review</h1>
              <p style={{ color: config.secondaryColor, opacity: 0.8 }}>Help others by sharing your experience.</p>
              
             
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {config.showRatings && (
                <div>
                  <label style={{ fontWeight: "700", color: config.secondaryColor }}>Your Rating *</label>
                  <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={24} fill={i <= 4 ? config.starColor : "none"} stroke={config.starColor} />)}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontWeight: "700", color: config.secondaryColor }}>Name</label>
                <input type="text" placeholder="Jane Doe" style={styles.input} />
              </div>

              <div>
                <label style={{ fontWeight: "700", color: config.secondaryColor }}>Detailed Review *</label>
                <textarea placeholder="Tell us more..." style={{ ...styles.input, height: "100px", resize: "none" }} />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                {config.showPhotos && (
                  <div style={styles.uploadBox}>
                    <ImageIcon size={20} color={config.primaryColor} />
                    <span style={{ fontSize: "11px", fontWeight: "700" }}>Photos</span>
                  </div>
                )}
                {config.showVideos && (
                  <div style={styles.uploadBox}>
                    <Video size={20} color={config.primaryColor} />
                    <span style={{ fontSize: "11px", fontWeight: "700" }}>Video</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button style={{ background: "none", border: "none", color: config.secondaryColor, cursor: "pointer" }}>Cancel</button>
              <button style={{ 
                padding: "12px 24px", 
                backgroundColor: config.buttonColor, 
                color: "#fff", 
                border: "none", 
                borderRadius: `${config.borderRadius / 1.5}px`, 
                fontWeight: "700", 
                cursor: "pointer" 
              }}>
                Submit Review
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-components kept similar but ensuring they use internal spacing logic
function SideSection({ title, icon, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", marginBottom: "12px", textTransform: "uppercase", fontSize: "11px", fontWeight: "800" }}>
        {icon} {title}
      </div>
      <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "12px" }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, active, onClick }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={onClick}>
      <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>{label}</span>
      <div style={{ width: "34px", height: "18px", borderRadius: "20px", backgroundColor: active ? "#10b981" : "#e2e8f0", position: "relative" }}>
        <div style={{ width: "14px", height: "14px", backgroundColor: "#fff", borderRadius: "50%", position: "absolute", top: "2px", left: active ? "18px" : "2px", transition: "0.2s" }} />
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "20px", height: "20px", border: "none", padding: 0, cursor: "pointer" }} />
        <span style={{ fontSize: "9px", fontFamily: "monospace" }}>{value}</span>
      </div>
    </div>
  );
}

function Slider({ label, min, max, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
        <span>{label}</span>
        <span style={{ fontWeight: "800" }}>{value}px</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} style={{ width: "100%", accentColor: "#10b981" }} />
    </div>
  );
}