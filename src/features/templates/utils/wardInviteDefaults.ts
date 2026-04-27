/**
 * Seed copy for the ward-member invitation message. Used as the default
 * when the ward has not authored its own template, and as the starting
 * point on the `/settings/templates/ward-invites` editor.
 *
 * Variables: {{inviteeName}}, {{wardName}}, {{inviterName}},
 * {{calling}} (pretty-printed), {{role}}.
 */

export const DEFAULT_WARD_INVITE_BODY = `Hi {{inviteeName}},

{{inviterName}} has invited you to help plan sacrament meetings for {{wardName}} in Steward, as {{calling}}.

We're grateful for your willingness to serve — Steward keeps the bishopric, clerks, and executive secretary in sync on speakers, music, and the weekly program so Sunday worship is prayerfully prepared.`;
