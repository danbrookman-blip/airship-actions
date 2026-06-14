/**
 * Deep links into the Airship dashboard.
 *
 * The contact profile is the older ContactManager "Edit Contact" page. The
 * contact is passed as a query param — adjust `CONTACT_PROFILE_BASE` / the param
 * name here if the live dashboard expects a different shape (e.g. an id in the
 * path like /EditContact/<id>.html). In sample mode the ids are mock, so the
 * link won't resolve to a real record; under a live token it carries the real
 * Airship contact id from Search Contact.
 */

const CONTACT_PROFILE_BASE = "https://www.airship.co.uk/ContactManager/EditContact/__default.html";

export function airshipContactUrl(contactId: string): string {
  return `${CONTACT_PROFILE_BASE}?contactId=${encodeURIComponent(contactId)}`;
}
