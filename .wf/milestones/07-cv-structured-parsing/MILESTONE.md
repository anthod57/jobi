---
id: M7
title: Extraction structurée du CV, profil auto-rempli & score ATS évolué
status: done
branch: milestone/07-cv-structured-parsing
---
# M7 — Extraction structurée du CV, profil auto-rempli & score ATS

**Goal:** extraire fidèlement tout format de CV (1 ou 2 colonnes, bandeau pleine largeur, flux PDF désordonné, DOCX) via `pdfjs-dist` + architecture hybride (100 % fonctionnelle sans clé LLM, enrichie automatiquement si une clé LLM utilisateur est configurée), persister la structure riche en base, alimenter un score ATS déterministe évolué et permettre de pré-remplir le profil depuis un CTA visible en haut de `/profil`.

**Out of scope:** OCR d'images scannées sans couche texte, stockage binaire du fichier CV, score ATS chiffré calculé par LLM (le score reste 100 % déterministe).

## Phases

| # | File | Role | Needs | Status |
|---|------|------|-------|--------|
| 01 | 01-cv-structured-parsing.md | api | M3-02 | done |
| 02 | 02-cv-ats-ui.md | web | M7-01 | done |

## Decisions (jalon)

| Sujet | Choix |
|-------|--------|
| Stratégie d'extraction | Hybride : layout PDF par coordonnées `(x, y)` (`pdfjs-dist`) + structuration LLM (JSON validé Zod) si clé configurée, sinon fallback 100 % déterministe (heuristiques améliorées) |
| Persistance | Ajout de `structured_sections` (JSONB), `parse_mode` (`"llm" \| "deterministic"`), `is_multi_column` (boolean), `page_count` (smallint) sur `profile_cv` |
| Schéma structuré | `StructuredCv` riche (`contact` objet, `experiences[]` typées, `education[]` typées, `skills[]`, `softSkills[]`, `other[]`) |
| Score ATS | 100 % déterministe dans `src/lib/profile/ats/`, enrichi via `structured` et `layout` (`isMultiColumn`, `pageCount`) optionnels dans `AtsContext` |
| Auto-remplissage profil | CTA en haut de `/profil` (sans scroll) pour importer/pré-remplir le profil depuis le CV parsé ; badge clair IA vs mode local sans clé |
