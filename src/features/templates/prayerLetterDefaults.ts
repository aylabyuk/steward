/**
 * Seed copy for the ward-default prayer invitation letter. The prayer
 * letter is intentionally distinct from the speaker letter — shorter,
 * more reverent in tone, focused on the privilege of prayer rather
 * than the speaker's preparation arc. The bishop can edit any of this
 * at `/settings/templates/prayer-letter`; the defaults just guarantee
 * a polished letter even before anyone customises anything.
 *
 * Variables available in either body or footer:
 *   {{prayerGiverName}}, {{prayerType}}, {{date}}, {{wardName}},
 *   {{inviterName}}, {{today}}
 *
 * `{{prayerType}}` resolves to "opening prayer" or "benediction"
 * depending on which slot the bishop is inviting.
 */

export const DEFAULT_PRAYER_LETTER_BODY = `Dear {{prayerGiverName}},

The bishopric invites you to offer the **{{prayerType}}** in sacrament meeting.

A reverent prayer at the open or close of our worship sets the Spirit upon the congregation and centres our hearts. We are grateful for your willingness to serve in this small but tender way.

Please let a member of the bishopric know if this invitation works for you. We trust the Spirit will guide you in your words.

With gratitude,
`;

export const DEFAULT_PRAYER_LETTER_FOOTER = "Pray always, and I will pour out my Spirit upon you";
