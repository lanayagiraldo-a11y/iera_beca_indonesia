# iERA Scholarship Tracker · Dawah Pioneers Indonesia 2026

App de seguimiento del Programa de Becas iERA para candidatos seleccionados al programa de 3 meses en Indonesia.

**Stack:** Vite + React + Tailwind CSS + Supabase
**Deploy:** Netlify
**Versión:** 0.1.0 (Fase 1 del PRD)

---

## 🚀 Ejecutar localmente

```bash
npm install
npm run dev
```

La app abre en `http://localhost:5173`.

---

## 📂 Estructura del proyecto

```
src/
├── lib/
│   ├── supabase.js       # Cliente Supabase
│   └── constants.js      # Etapas, idiomas, criterios prioridad
├── components/
│   └── Layout.jsx        # Sidebar + topbar
├── pages/
│   ├── Dashboard.jsx     # KPIs y embudo
│   ├── Candidates.jsx    # Lista de candidatos con filtros
│   ├── CandidateNew.jsx  # Formulario 25 campos (Fase 1 PRD)
│   ├── CandidateDetail.jsx # Detalle + cambio de etapa
│   └── Pipeline.jsx      # Vista Kanban 13 etapas
├── App.jsx               # Router
├── main.jsx              # Entry point
└── index.css             # Tailwind + componentes base
```

---

## 🔐 Variables de entorno

Archivo `.env` (NO subir a GitHub — protegido por `.gitignore`):

```
VITE_SUPABASE_URL=https://ffcnkmtgvvieieyyeqyd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

---

## 🗄 Base de datos (Supabase)

**Proyecto:** `iera-tracker` · **Region:** us-east-1

**Tablas Fase 1:**
- `countries` — los 7 países del programa (ya seedeados)
- `candidates` — candidatos con 35+ campos del Manual v1.1
- `documents` — pasaporte, Tazkiyah, antecedentes, etc.
- `evaluations` — rúbrica 100 puntos
- `stages_history` — log de cambios de etapa

**Pendiente para Fase 2:** `reports`, `cost_tracking`, `contracts`, `exit_requests`, `employment_offers`, `post_program_tracking`, `alerts`.

---

## 📋 Roadmap (siguiente lo más importante)

### ✅ Fase 1 — Base operativa
- [x] Setup proyecto + Supabase
- [x] Formulario candidato 25 campos
- [x] Pipeline 13 etapas
- [x] 7 países del programa
- [x] Localización español
- [ ] Subida de documentos (Supabase Storage)
- [ ] Ficha de evaluación 100 pts (UI completa, schema ya listo)

### Fase 2 — Operación real
- [ ] Sistema de reportes (semanal/mensual)
- [ ] Alertas automáticas
- [ ] Gantt poblado
- [ ] Permisos por país (RLS estricto)
- [ ] Plantillas de comunicación

### Fase 3 — Diferenciadores
- [ ] WhatsApp Business Cloud API
- [ ] Contrato digital + reembolso prorrateado
- [ ] Seguimiento post-programa 12 meses
- [ ] Dashboard de impacto
- [ ] i18n inglés y árabe

Ver `PRD_App_Becas_Indonesia.md` (en carpeta Becas Indonesia) para detalle completo.

---

## 🚢 Deploy a Netlify

### Primera vez

1. **Subir a GitHub primero** (importante por seguridad):

```bash
cd "/Users/lilianaanaya/Documents/01_Proyectos de codigo/Activos/iera-scholarship-tracker"
git init
git add .
git commit -m "Initial commit - Phase 1"
gh repo create iera-scholarship-tracker --private --source=. --push
```

2. **Conectar Netlify a GitHub:**
   - [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import existing project" → GitHub
   - Selecciona el repo `iera-scholarship-tracker`
   - Build command: `npm run build` (autodetecta)
   - Publish directory: `dist`

3. **Variables de entorno en Netlify:**
   - Site settings → Environment variables → agregar:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - **NO subas el archivo `.env` a GitHub** (ya excluido por `.gitignore`)

4. Deploy automático en cada `git push`.

---

## 🛡 Seguridad

- ✅ `.env` excluido de Git
- ✅ Row Level Security (RLS) habilitado en todas las tablas
- ⚠ Políticas actuales son permisivas (Fase 1 = single-user). En Fase 2 se restringirán por país.
- 🔑 La `anon key` de Supabase es pública por diseño — la seguridad real vive en las políticas RLS.

---

## 📞 Contacto

iERA · Liliana Anaya · lanayagiraldo@gmail.com
