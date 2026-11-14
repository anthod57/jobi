---
id: M7
title: Extraction structurée du CV (multi-colonnes & compétences)
status: active
branch: milestone/07-cv-structured-parsing
---
# M7 — Extraction structurée du CV

**Goal:** extraire fidèlement les informations de tout format de CV (1 ou 2 colonnes, flux PDF désordonné, DOCX) dans les bonnes sections (`contact`, `experiences`, `skills` incluant `Stack technique`, `softSkills`, `education`, `other`) sans fuite de titres/sous-titres ni d'expériences dans les compétences.

**Out of scope:** enrichissement LLM payant/externe, OCR d'images scannées sans couche texte, stockage binaire du fichier CV.

## Phases

| # | File | Role | Needs | Status |
|---|------|------|-------|--------|
| 01 | 01-cv-structured-parsing.md | api | M3-02 | discuss |

## Decisions (jalon)

| Sujet | Choix |
|-------|--------|
| Stratégie | 100 % déterministe (coordonnées PDF `(x, y)` + heuristiques), sans appel LLM |
| Formats supportés | PDF 1 colonne, PDF 2 colonnes / flux désordonné (Canva, Figma, HTML-to-PDF), DOCX |
| Taxonomie | `Stack technique` / `Technologies` fusionnés dans `skills` ; sous-titres (`Front-End`, `Back-End`, `Base de données`, `Autres`) filtrés |
| Persistance | Aucun changement de schéma SQL (`profile_cv.extracted_text` conservé) |
