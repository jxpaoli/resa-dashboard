-- Ajoute la colonne "zone" (zone de salle) à la table reservations.
-- À exécuter une fois dans l'éditeur SQL Supabase (prod).
-- Valeurs applicatives : 'T1'..'T4' | 'S1'..'S4' | null. Colonne libre (text), pas de contrainte.

alter table reservations add column if not exists zone text;
