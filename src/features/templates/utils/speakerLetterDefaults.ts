/**
 * Seed copy for the ward-default speaker invitation letter. Matches
 * the v2 design reference (design/v2-schedule/.../SpeakerEditor.jsx
 * and the "Invitation to Speak" PDF mockup). Wards can edit this from
 * /settings/templates/speakers — the defaults just guarantee a
 * polished letter even before anyone customizes anything.
 *
 * Variables available in either body or footer:
 *   {{speakerName}}, {{topic}}, {{date}}, {{wardName}},
 *   {{inviterName}}, {{today}}
 */

export const DEFAULT_SPEAKER_LETTER_BODY = `Dear {{speakerName}},

The bishopric has prayerfully considered the needs of our ward, and we feel inspired to invite you to speak in sacrament meeting.

We have prayerfully considered a topic for your remarks: *{{topic}}*. We trust the Spirit will guide you as you prepare.

We ask that your remarks be approximately **twelve to fifteen minutes** in length, and grounded in the scriptures and the words of living prophets.

Please let a member of the bishopric know if this invitation works for you, or if you would prefer a different Sunday. We are grateful for your willingness to serve.

With gratitude,
`;

export const DEFAULT_SPEAKER_LETTER_FOOTER =
  "And all things whatsoever ye shall ask in prayer, believing, ye shall receive";
