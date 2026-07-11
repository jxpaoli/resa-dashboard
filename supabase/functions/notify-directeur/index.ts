// Edge Function : notifie le(s) directeur(s) d'une app quand le staff propose
// une réservation. Déclenchée par un Database Webhook (INSERT sur reservations).
//
// Secrets à définir (Supabase → Edge Functions → notify-directeur → Secrets) :
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, WEBHOOK_SECRET
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.)
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

webpush.setVapidDetails('mailto:direction@t2t.fr', VAPID_PUBLIC, VAPID_PRIVATE);
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

Deno.serve(async (req) => {
  // Petite protection : le webhook doit envoyer le bon secret
  if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const r = body.record;
  // On ne notifie que les propositions du staff
  if (!r || r.status !== 'proposed' || r.source !== 'staff') {
    return new Response('skip', { status: 200 });
  }

  // Directeurs de cette app
  const { data: dirs } = await admin
    .from('memberships').select('user_id').eq('app_id', r.app_id).eq('role', 'directeur');
  const ids = (dirs || []).map((d) => d.user_id);
  if (!ids.length) return new Response('no-directeur', { status: 200 });

  // Leurs abonnements push
  const { data: subs } = await admin
    .from('push_subscriptions').select('subscription').in('user_id', ids);

  const payload = JSON.stringify({
    title: 'Nouvelle réservation à valider',
    body: `${r.nom} — ${r.heure} — ${r.couverts} couv.`,
  });

  await Promise.allSettled(
    (subs || []).map((s) =>
      webpush.sendNotification(s.subscription, payload).catch(async (err) => {
        // Abonnement expiré / invalide → on le supprime
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', s.subscription.endpoint);
        }
      })
    )
  );

  return new Response('ok', { status: 200 });
});
