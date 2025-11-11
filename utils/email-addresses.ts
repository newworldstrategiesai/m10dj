/**
 * Email addresses configuration for M10 DJ Company
 * All addresses use the same domain and receive via Resend webhooks
 */

export const EMAIL_ADDRESSES = [
  {
    id: "hello",
    name: "General Inquiries",
    email: "hello@m10djcompany.com",
    description: "Main contact email",
    avatar: "👋",
  },
  {
    id: "info",
    name: "Information",
    email: "info@m10djcompany.com",
    description: "Information requests",
    avatar: "ℹ️",
  },
  {
    id: "ben",
    name: "Ben Murray",
    email: "ben@m10djcompany.com",
    description: "Direct contact",
    avatar: "🎤",
  },
];

export const EMAIL_DOMAIN = "m10djcompany.com";
export const CATCH_ALL_EMAIL = "hello@m10djcompany.com";

/**
 * Get all email addresses as EmailAccount format for the sidebar
 */
export function getEmailAccounts() {
  return EMAIL_ADDRESSES.map((addr) => ({
    id: addr.id,
    name: addr.name,
    email: addr.email,
    avatar: addr.avatar,
  }));
}

/**
 * Get email address by ID
 */
export function getEmailAddressById(id: string) {
  return EMAIL_ADDRESSES.find((addr) => addr.id === id);
}

/**
 * Get all email addresses for API queries
 */
export function getAllEmailAddresses() {
  return EMAIL_ADDRESSES.map((addr) => addr.email);
}

