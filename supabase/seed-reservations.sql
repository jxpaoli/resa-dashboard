-- ============================================================================
-- RÉSERVATIONS DE TEST — « Aux Terrasses de Troinex »
-- ----------------------------------------------------------------------------
-- Génère des réservations du 11 au 30 juillet, avec une DENSITÉ DÉCROISSANTE :
-- beaucoup le 11 (jusqu'à ~145 couverts, la pointe), de moins en moins vers
-- le 30 (~20). Moyenne ~100 couverts/jour sur la première semaine.
--
-- • status = 'validated'  → visibles dans Liste / Plan / Arrivée
-- • quelques 'proposed'/'staff' → pour tester la page « À valider »
-- • service déduit de l'heure (midi avant 16:00, soir après)
-- • un pool de clients fixes est réutilisé → la page Clients se remplit toute
--   seule (via le trigger) avec un vrai historique par téléphone.
--
-- Utilisation : Supabase → SQL Editor → coller → Run.
-- Idempotent : réexécutable (efface d'abord les résas de test sur la plage).
-- Change v_start ci-dessous si l'année/le mois diffèrent.
-- ============================================================================

do $$
declare
  v_app        uuid;
  v_start      date := date '2026-07-11';   -- 1er jour (le plus rempli)
  v_days       int  := 20;                  -- 11 -> 30 juillet inclus

  -- pool de clients (identités + téléphones fixes, réutilisés)
  N            int := 90;
  last_names   text[] := array['Rossi','Favre','Dubois','Meier','Nguyen','Rey','Costa','Bianchi','Schneider','Lopes','Girard','Perrin','Marchand','Blanc','Roux','Fontana','Keller','Moret','da Silva','Chevalier','Aubert','Zbinden','Henry','Paoli','Lefèvre','Guérin','Studer','Berger','Morel','Fournier','Lambert','Bonvin','Pittet','Chappuis','Gerber','Muller','Baumann','Fischer','Weber','Rochat'];
  first_names  text[] := array['Élodie','Laurent','Catherine','Thomas','Linh','Pascal','Maria','Marco','Anne','João','Sophie','Julien','Isabelle','Nicolas','Nathalie','Luca','Petra','Alain','Ana','Éric','Camille','Markus','Valérie','Jean','Christine','Fabrice','Monika','Sébastien','Claire','David','Sandrine','Olivier','Céline','Michel','Patricia'];
  companies    text[] := array['Genève Audit SA','Clinique du Léman','Étude Dupont & Associés','Fiduciaire Léman','Banque Privée GE','Cabinet Roches','Horlogerie Vacher','Domaine de Troinex','SIG Services','Régie Naef'];
  pool_civ     text[] := '{}';
  pool_nom     text[] := '{}';
  pool_prenom  text[] := '{}';
  pool_email   text[] := '{}';
  pool_tel     text[] := '{}';

  midi_slots   text[] := array['11:30','11:45','12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45','14:00','14:15','14:30'];
  soir_slots   text[] := array['18:30','18:45','19:00','19:15','19:30','19:45','20:00','20:15','20:30','20:45','21:00','21:15','21:30','21:45'];
  notes_pool   text[] := array['Table près de la fenêtre','Anniversaire','Allergie fruits à coque','Poussette / chaise haute','Client régulier','Terrasse si possible','Repas d''affaires','Table calme svp'];

  i int; u bigint; off int; d date; dow int; j int; k int;
  target numeric; target_i int; wk numeric;
  midi_target int; soir_target int; svc_target int;
  svc text; slots text[]; acc int; tbl int; couv int; table_num int;
  h text; rem text; src text; note text;
  cidx int; hidx int; rnd numeric;
  n_ins int := 0; n_prop int := 0;
begin
  select id into v_app from apps where slug = 'aux-terrasses-troinex';
  if v_app is null then
    raise exception 'App introuvable : aucun apps.slug = ''aux-terrasses-troinex''. Lance schema.sql d''abord.';
  end if;

  -- On coupe les notifications push le temps du remplissage (si le trigger existe)
  begin execute 'alter table reservations disable trigger trg_notify_proposee'; exception when others then null; end;

  -- Remise à zéro des résas de test sur la plage (idempotent)
  delete from reservations
  where app_id = v_app and date between v_start and v_start + (v_days - 1);

  -- ---- Construction du pool de clients ----
  for i in 1..N loop
    if i % 9 = 0 then
      pool_civ[i]    := 'Entreprise';
      pool_nom[i]    := companies[1 + (i % array_length(companies,1))];
      pool_prenom[i] := null;
      pool_email[i]  := 'contact' || i || '@example.com';
    else
      pool_civ[i]    := case when i % 2 = 0 then 'Mme' else 'M.' end;
      pool_nom[i]    := last_names[1 + (i % array_length(last_names,1))];
      pool_prenom[i] := first_names[1 + (i % array_length(first_names,1))];
      pool_email[i]  := 'client' || i || '@example.com';
    end if;
    u := 10000000 + i * 811;   -- 8 chiffres, unique par i
    pool_tel[i] := '06 ' || substr(u::text,1,2) || ' ' || substr(u::text,3,2)
                        || ' ' || substr(u::text,5,2) || ' ' || substr(u::text,7,2);
  end loop;

  -- ---- Génération jour par jour ----
  for off in 0..(v_days - 1) loop
    d   := v_start + off;
    dow := extract(dow from d);                 -- 0=dim ... 6=sam

    -- décroissance exponentielle + bosse week-end + petit bruit
    target := 20 + 125 * exp(-off / 6.0);
    wk := case when dow = 6 then 1.18 when dow = 5 then 1.12 when dow = 0 then 1.00 else 0.90 end;
    target := target * wk * (0.95 + random() * 0.10);
    target_i := least(145, greatest(16, round(target)::int));

    midi_target := round(target_i * 0.42)::int;  -- midi un peu plus calme
    soir_target := target_i - midi_target;

    for j in 1..2 loop
      if j = 1 then svc := 'midi'; slots := midi_slots; svc_target := midi_target;
      else          svc := 'soir'; slots := soir_slots; svc_target := soir_target;
      end if;

      acc := 0; tbl := 0;
      while acc < svc_target loop
        -- taille de table (pondérée, moyenne ~3.7)
        rnd := random();
        couv := case
          when rnd < 0.40 then 2  when rnd < 0.55 then 3  when rnd < 0.75 then 4
          when rnd < 0.83 then 5  when rnd < 0.91 then 6  when rnd < 0.945 then 7
          when rnd < 0.975 then 8 when rnd < 0.99 then 10 else 12 end;
        if acc + couv > svc_target + 5 then couv := greatest(2, svc_target - acc); end if;

        -- remise (pondérée)
        rnd := random();
        rem := case when rnd < 0.60 then 'plein' when rnd < 0.82 then '-30%'
                    when rnd < 0.92 then '-50%' else null end;

        -- provenance
        rnd := random();
        src := case when rnd < 0.45 then 'thefork' when rnd < 0.70 then 'wix' else 'directeur' end;

        -- table posée (~55%), numéro unique dans le service
        if random() < 0.55 then tbl := tbl + 1; table_num := tbl; else table_num := null; end if;

        -- note occasionnelle
        if random() < 0.10 then note := notes_pool[1 + floor(random() * array_length(notes_pool,1))::int];
        else note := null; end if;

        cidx := 1 + floor(random() * N)::int;
        hidx := 1 + floor(random() * array_length(slots,1))::int;
        h    := slots[hidx];

        insert into reservations
          (app_id, civilite, nom, prenom, email, telephone, date, heure, couverts,
           remise, notes, numero_table, status, source, service, presence, evenement)
        values
          (v_app, pool_civ[cidx], pool_nom[cidx], pool_prenom[cidx], pool_email[cidx], pool_tel[cidx],
           d, h, couv, rem, note, table_num, 'validated', src::resa_source, svc::resa_service, null, false);

        acc := acc + couv;
        n_ins := n_ins + 1;
      end loop;
    end loop;
  end loop;

  -- ---- Quelques réservations « à valider » (proposées par le staff) ----
  for k in 1..5 loop
    cidx := 1 + floor(random() * N)::int;
    off  := floor(random() * 5)::int;              -- sur les 5 premiers jours
    d    := v_start + off;
    hidx := 1 + floor(random() * array_length(soir_slots,1))::int;
    couv := 2 + floor(random() * 5)::int;          -- 2..6
    insert into reservations
      (app_id, civilite, nom, prenom, email, telephone, date, heure, couverts,
       remise, notes, numero_table, status, source, service, presence, evenement)
    values
      (v_app, pool_civ[cidx], pool_nom[cidx], pool_prenom[cidx], pool_email[cidx], pool_tel[cidx],
       d, soir_slots[hidx], couv, 'plein', 'Proposée par le staff — à confirmer', null,
       'proposed', 'staff', 'soir', null, false);
    n_prop := n_prop + 1;
  end loop;

  -- ---- Quelques notes clients (pour des fiches plus vivantes) ----
  update clients set notes = 'Allergie fruits de mer' where app_id = v_app and telephone = pool_tel[3];
  update clients set notes = 'Sans gluten'            where app_id = v_app and telephone = pool_tel[5];
  update clients set notes = 'Végétarienne'           where app_id = v_app and telephone = pool_tel[7];
  update clients set notes = 'Cliente VIP'            where app_id = v_app and telephone = pool_tel[11];
  update clients set notes = 'Intolérance au lactose' where app_id = v_app and telephone = pool_tel[13];
  update clients set notes = 'Habitué du soir'         where app_id = v_app and telephone = pool_tel[17];

  -- Réactive les notifications push
  begin execute 'alter table reservations enable trigger trg_notify_proposee'; exception when others then null; end;

  raise notice 'OK — % réservations validées + % à valider, du % au %.',
    n_ins, n_prop, v_start, v_start + (v_days - 1);
end $$;

-- Aperçu de la courbe (couverts / réservations par jour) :
select date,
       to_char(date, 'TMDy') as jour,
       sum(couverts)                              as couverts,
       count(*)                                   as resas,
       sum(couverts) filter (where service = 'midi') as midi,
       sum(couverts) filter (where service = 'soir') as soir
from reservations
where app_id = (select id from apps where slug = 'aux-terrasses-troinex')
  and date between date '2026-07-11' and date '2026-07-30'
  and status = 'validated'
group by date
order by date;

-- ----------------------------------------------------------------------------
-- NETTOYAGE (optionnel) — supprime toutes les réservations de test de la plage
-- (et, si tu veux, les clients générés en @example.com) :
-- ----------------------------------------------------------------------------
-- delete from reservations
-- where app_id = (select id from apps where slug = 'aux-terrasses-troinex')
--   and date between date '2026-07-11' and date '2026-07-30';
-- delete from clients
-- where app_id = (select id from apps where slug = 'aux-terrasses-troinex')
--   and email ilike '%@example.com';
