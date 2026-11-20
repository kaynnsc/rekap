import React, { useState, useRef } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Plus, Trash2, ChevronDown, ChevronRight, DatabaseBackup, HardDriveUpload } from "lucide-react";
import { uid } from "./App";
import { BODY, cardStyle, SectionTitle, compactInputStyle as inputStyle, ghostBtnStyle, primaryBtnStyle, iconBtnStyle } from "./ui";

const AUTH_DOC_REF = doc(db, "pricelist", "main");

function OptionSection({ T, title, list, onChange, hasColor, hasDays, hasContact, editingRef }) {
  const [open, setOpen] = useState(false);

  const update = (id, patch) => onChange(list.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const remove = (id) => onChange(list.filter((o) => o.id !== id));
  const add = () => onChange([...list, { id: uid(), label: "New option", ...(hasColor ? { color: "#93AFC9" } : {}), ...(hasDays ? { days: 1 } : {}), ...(hasContact ? { contact: "" } : {}) }]);

  return (
    <div style={{ ...cardStyle(T, { borderRadius: 12, boxShadow: "3px 3px 0 " + T.border }), marginBottom: 14, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 14px", minHeight: 52, cursor: "pointer", fontFamily: BODY }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{title} <span style={{ color: T.inkMuted, fontWeight: 700, fontSize: 12 }}>({list.length})</span></span>
        {open ? <ChevronDown size={18} color={T.ink} /> : <ChevronRight size={18} color={T.ink} />}
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {list.map((opt) => (
              <div key={opt.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {hasColor && (
                  <input type="color" value={opt.color || "#93AFC9"} onChange={(e) => update(opt.id, { color: e.target.value })} style={{ width: 36, height: 36, padding: 0, border: `2px solid ${T.border}`, borderRadius: 10, background: "none", flexShrink: 0, cursor: "pointer" }} />
                )}
                <input
                  defaultValue={opt.label}
                  onFocus={() => (editingRef.current = true)}
                  onBlur={(e) => { editingRef.current = false; update(opt.id, { label: e.target.value }); }}
                  onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                  style={{ ...inputStyle(T), flex: 1, minWidth: 0 }}
                />
                {hasDays && (
                  <input
                    type="number"
                    defaultValue={opt.days === null ? "" : opt.days}
                    placeholder="lifetime"
                    onFocus={() => (editingRef.current = true)}
                    onBlur={(e) => { editingRef.current = false; update(opt.id, { days: e.target.value === "" ? null : parseInt(e.target.value, 10) }); }}
                    style={{ ...inputStyle(T), width: 72, flexShrink: 0 }}
                    title="Days until expiry (leave blank for lifetime)"
                  />
                )}
                {hasContact && (
                  <input
                    defaultValue={opt.contact}
                    placeholder="Contact"
                    onFocus={() => (editingRef.current = true)}
                    onBlur={(e) => { editingRef.current = false; update(opt.id, { contact: e.target.value }); }}
                    style={{ ...inputStyle(T), width: 110, flexShrink: 0 }}
                  />
                )}
                <button onClick={() => remove(opt.id)} style={{ ...iconBtnStyle(T), color: T.negative, flexShrink: 0 }}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
          <button onClick={add} style={ghostBtnStyle(T)}><Plus size={12} /> Add option</button>
        </div>
      )}
    </div>
  );
}

function SupplierSection({ T, list, onChange, editingRef }) {
  const [open, setOpen] = useState(false);

  const updateSupplier = (id, patch) => onChange(list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSupplier = (id) => onChange(list.filter((s) => s.id !== id));
  const addSupplier = () => onChange([...list, { id: uid(), label: "New supplier", contacts: [{ id: uid(), name: "Admin 1", contact: "" }] }]);

  const addContact = (supplierId) => {
    updateSupplier(supplierId, { contacts: [...(list.find((s) => s.id === supplierId)?.contacts || []), { id: uid(), name: "New admin", contact: "" }] });
  };
  const updateContact = (supplierId, contactId, patch) => {
    const supplier = list.find((s) => s.id === supplierId);
    if (!supplier) return;
    updateSupplier(supplierId, { contacts: supplier.contacts.map((c) => (c.id === contactId ? { ...c, ...patch } : c)) });
  };
  const removeContact = (supplierId, contactId) => {
    const supplier = list.find((s) => s.id === supplierId);
    if (!supplier) return;
    updateSupplier(supplierId, { contacts: supplier.contacts.filter((c) => c.id !== contactId) });
  };

  return (
    <div style={{ ...cardStyle(T, { borderRadius: 12, boxShadow: "3px 3px 0 " + T.border }), marginBottom: 14, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 14px", minHeight: 52, cursor: "pointer", fontFamily: BODY }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>Suppliers (First Hand) <span style={{ color: T.inkMuted, fontWeight: 700, fontSize: 12 }}>({list.length})</span></span>
        {open ? <ChevronDown size={18} color={T.ink} /> : <ChevronRight size={18} color={T.ink} />}
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((supplier) => (
            <div key={supplier.id} style={{ border: `2px dashed ${T.border}`, borderRadius: 12, padding: 10 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <input
                  defaultValue={supplier.label}
                  onFocus={() => (editingRef.current = true)}
                  onBlur={(e) => { editingRef.current = false; updateSupplier(supplier.id, { label: e.target.value }); }}
                  onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                  style={{ ...inputStyle(T), flex: 1, fontWeight: 700 }}
                  placeholder="Supplier name"
                />
                <button onClick={() => removeSupplier(supplier.id)} style={{ ...iconBtnStyle(T), color: T.negative, flexShrink: 0 }}><Trash2 size={13} /></button>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: T.inkMuted, marginBottom: 6, paddingLeft: 2, textTransform: "uppercase", letterSpacing: ".06em" }}>Admins / contacts for this supplier</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {(supplier.contacts || []).map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 8 }}>
                    <input
                      defaultValue={c.name}
                      onFocus={() => (editingRef.current = true)}
                      onBlur={(e) => { editingRef.current = false; updateContact(supplier.id, c.id, { name: e.target.value }); }}
                      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                      style={{ ...inputStyle(T), width: 100, flexShrink: 0 }}
                      placeholder="Admin name"
                    />
                    <input
                      defaultValue={c.contact}
                      onFocus={() => (editingRef.current = true)}
                      onBlur={(e) => { editingRef.current = false; updateContact(supplier.id, c.id, { contact: e.target.value }); }}
                      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                      style={{ ...inputStyle(T), flex: 1, minWidth: 0 }}
                      placeholder="+62..."
                    />
                    <button onClick={() => removeContact(supplier.id, c.id)} style={{ ...iconBtnStyle(T), color: T.negative, flexShrink: 0 }}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => addContact(supplier.id)} style={{ ...ghostBtnStyle(T), marginTop: 8, marginLeft: 8, padding: "6px 10px", fontSize: 11.5 }}>
                <Plus size={11} /> Add admin
              </button>
            </div>
          ))}
          <button onClick={addSupplier} style={ghostBtnStyle(T)}><Plus size={12} /> Add supplier</button>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage({ T, data, persist, authPassword, flashToast, editingRef, backupAll, restoreFromBackupFile }) {
  const { settings } = data;
  const [newPw, setNewPw] = useState("");
  const backupFileInputRef = useRef(null);

  const updateSettings = (patch) => persist({ ...data, settings: { ...settings, ...patch } });

  const changePassword = async () => {
    if (!newPw.trim()) return;
    try {
      await setDoc(AUTH_DOC_REF, { password: newPw.trim() }, { merge: true });
      flashToast("Password updated");
      setNewPw("");
    } catch (e) {
      flashToast("Couldn't update password");
    }
  };

  return (
    <div>
      <SectionTitle T={T} style={{ marginTop: 6 }}>Dropdown lists</SectionTitle>
      <p style={{ fontSize: 13, fontWeight: 800, color: T.inkMuted, margin: "0 0 14px" }}>
        Add, rename, recolor, or remove options here — every dropdown in the order form updates immediately, no code changes needed.
      </p>

      <OptionSection T={T} title="Platforms (Kode)" list={settings.platforms} onChange={(list) => updateSettings({ platforms: list })} hasColor editingRef={editingRef} />
      <OptionSection T={T} title="Apps (Aplikasi)" list={settings.apps} onChange={(list) => updateSettings({ apps: list })} hasColor editingRef={editingRef} />
      <OptionSection T={T} title="Plans" list={settings.plans} onChange={(list) => updateSettings({ plans: list })} editingRef={editingRef} />
      <OptionSection T={T} title="Durations (days until warranty expires)" list={settings.durations} onChange={(list) => updateSettings({ durations: list })} hasDays editingRef={editingRef} />
      <SupplierSection T={T} list={settings.suppliers} onChange={(list) => updateSettings({ suppliers: list })} editingRef={editingRef} />

      <div style={{ marginTop: 22 }}>
        <SectionTitle T={T} style={{ marginTop: 0 }}>Admin password</SectionTitle>
        <p style={{ fontSize: 13, fontWeight: 800, color: T.inkMuted, margin: "0 0 10px" }}>
          Shared with your pricelist site — changing it here changes the login for both.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password" style={{ ...inputStyle(T), flex: 1 }} />
          <button onClick={changePassword} style={{ ...primaryBtnStyle(T), minHeight: 40, borderRadius: 10 }}>Save</button>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <SectionTitle T={T} style={{ marginTop: 0 }}>Backup & restore</SectionTitle>
        <p style={{ fontSize: 13, fontWeight: 800, color: T.inkMuted, margin: "0 0 10px" }}>
          Downloads a JSON file with all your orders and dropdown settings. There's no automatic backup on the free plan, so it's worth doing this occasionally.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={backupAll} style={ghostBtnStyle(T)}><DatabaseBackup size={14} /> Download backup</button>
          <button onClick={() => backupFileInputRef.current && backupFileInputRef.current.click()} style={{ ...ghostBtnStyle(T), color: T.negative, borderColor: T.negative }}>
            <HardDriveUpload size={14} /> Restore from backup file
          </button>
          <input ref={backupFileInputRef} type="file" accept=".json" onChange={(e) => { restoreFromBackupFile(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} />
        </div>
        <p style={{ fontSize: 12, fontWeight: 800, color: T.inkMuted, marginTop: 8 }}>
          Restoring completely replaces your current orders and settings and can't be undone.
        </p>
      </div>

      <div style={{ height: 30 }} />
    </div>
  );
}
