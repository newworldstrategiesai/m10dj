/**
 * QR display page at /{slug}/qr (e.g. /m10djcompany/qr).
 * Re-exports the same page as /organizations/[slug]/qr so both URLs work.
 */

export { default } from '../organizations/[slug]/qr';
