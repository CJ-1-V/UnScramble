/**
 * UNSCRAMBLE FORM DELIVERY — the only place recipients and the endpoint are set.
 * ===========================================================================
 * Service: FormSubmit (https://formsubmit.co). No account and no server.
 * Static pages POST here from the browser. GitHub Pages does not run this code.
 *
 *   Request Labour  →  sandra@unscramble.ca   CC  admin@unscramble.ca
 *   Find Work       →  admin@unscramble.ca    CC  sandra@unscramble.ca
 *
 * ONE-TIME ACTIVATION (required before mail is delivered)
 * The first submission addressed to an inbox makes FormSubmit email that inbox
 * a confirmation link. Until the link is opened, submissions are not delivered.
 * Check spam and promotions for mail from FormSubmit.
 *
 *   1. Submit Request Labour once. sandra@unscramble.ca opens "Activate Form".
 *   2. Submit Find Work once. admin@unscramble.ca opens "Activate Form".
 *   3. After that, every labour request goes to Sandra with Admin copied,
 *      and every application goes to Admin with Sandra copied.
 *
 * The CC address does not activate anything. Activation is once per recipient,
 * not once per page. Captcha is off so people stay on our thank-you state;
 * a honeypot field is what blocks empty bots. Resume files must stay under
 * FormSubmit's 10 MB limit.
 */
window.UNSCRAMBLE_FORMS = {
  endpoint: "https://formsubmit.co/ajax/",
  template: "table",
  captcha: "false",
  labour: {
    to: "sandra@unscramble.ca",
    cc: "admin@unscramble.ca",
    subject: "Labour request — {farm}"
  },
  apply: {
    to: "admin@unscramble.ca",
    cc: "sandra@unscramble.ca",
    subject: "Work application — {name}"
  }
};
