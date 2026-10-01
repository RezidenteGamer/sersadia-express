import { createClient } from '@supabase/supabase-js';

const projectUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!projectUrl || !secretKey) throw new Error('Defina SUPABASE_URL e SUPABASE_SECRET_KEY.');

const supabase = createClient(projectUrl, secretKey, { auth: { persistSession: false } });
const prefix = `${projectUrl.replace(/\/$/, '')}/storage/v1/object/public/location-images/`;
const { data: payments, error } = await supabase.from('payments')
  .select('id, reservation_id, receipt_url, reservation:reservations(user_id)')
  .not('receipt_url', 'is', null);
if (error) throw error;

const legacy = payments.filter(payment => payment.receipt_url?.startsWith(prefix));
console.log(`${legacy.length} comprovante(s) antigo(s) em bucket público.`);
if (process.argv.includes('--apply')) for (const payment of legacy) {
  const oldPath = decodeURIComponent(payment.receipt_url.slice(prefix.length));
  const extension = oldPath.split('.').pop()?.toLowerCase();
  const mime = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const newPath = `${payment.reservation.user_id}/${payment.reservation_id}/legacy-${payment.id}.${extension || 'jpg'}`;
  const { data: source, error: downloadError } = await supabase.storage.from('location-images').download(oldPath);
  if (downloadError || !source) throw downloadError || new Error('Comprovante antigo indisponível');
  const { error: uploadError } = await supabase.storage.from('receipts').upload(newPath, source, {
    contentType: mime, upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data: copied, error: verifyError } = await supabase.storage.from('receipts').download(newPath);
  if (verifyError || copied?.size !== source.size) throw verifyError || new Error('Cópia do comprovante incompleta');
  const { data: updated, error: updateError } = await supabase.from('payments')
    .update({ receipt_url: newPath }).eq('id', payment.id).eq('receipt_url', payment.receipt_url)
    .select('id').single();
  if (updateError || !updated) throw updateError || new Error('Pagamento alterado por outra operação');
  const { error: removeError } = await supabase.storage.from('location-images').remove([oldPath]);
  if (removeError) throw removeError;
  console.log('Comprovante migrado e cópia pública removida.');
}
