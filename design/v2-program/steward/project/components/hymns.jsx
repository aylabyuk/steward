// Mock LDS hymnbook subset — { number, title } entries.
// In production this would be fetched; here it's inlined for the prototype.
const HYMNS = [
  { number: 2,   title: "The Spirit of God" },
  { number: 5,   title: "High on the Mountain Top" },
  { number: 19,  title: "We Thank Thee, O God, for a Prophet" },
  { number: 27,  title: "Praise to the Man" },
  { number: 30,  title: "Come, Come, Ye Saints" },
  { number: 58,  title: "Come, Ye Children of the Lord" },
  { number: 66,  title: "Rejoice, the Lord Is King!" },
  { number: 72,  title: "Praise to the Lord, the Almighty" },
  { number: 85,  title: "How Firm a Foundation" },
  { number: 89,  title: "The Lord Is My Light" },
  { number: 92,  title: "For the Beauty of the Earth" },
  { number: 95,  title: "Now Thank We All Our God" },
  { number: 98,  title: "I Need Thee Every Hour" },
  { number: 103, title: "Precious Savior, Dear Redeemer" },
  { number: 117, title: "Come unto Jesus" },
  { number: 136, title: "I Know That My Redeemer Lives" },
  { number: 140, title: "Did You Think to Pray?" },
  { number: 141, title: "Jesus, the Very Thought of Thee" },
  { number: 142, title: "Sweet Hour of Prayer" },
  { number: 152, title: "God Be with You Till We Meet Again" },
  { number: 169, title: "As Now We Take the Sacrament" },
  { number: 170, title: "God, Our Father, Hear Us Pray" },
  { number: 173, title: "While of These Emblems We Partake" },
  { number: 181, title: "Jesus of Nazareth, Savior and King" },
  { number: 184, title: "Upon the Cross of Calvary" },
  { number: 193, title: "I Stand All Amazed" },
  { number: 220, title: "Lord, I Would Follow Thee" },
  { number: 223, title: "Have I Done Any Good?" },
  { number: 237, title: "Do What Is Right" },
  { number: 239, title: "Choose the Right" },
  { number: 241, title: "Count Your Blessings" },
  { number: 243, title: "Let Us All Press On" },
  { number: 249, title: "Called to Serve" },
  { number: 252, title: "Put Your Shoulder to the Wheel" },
  { number: 270, title: "I'll Go Where You Want Me to Go" },
  { number: 277, title: "As I Search the Holy Scriptures" },
  { number: 292, title: "O My Father" },
  { number: 301, title: "I Am a Child of God" },
];

// Category hints — loose, for suggestion chips
const SACRAMENT_NUMS = [169, 170, 173, 181, 184, 193];
const OPENING_SUGGESTIONS = [2, 5, 19, 27, 66, 72, 243];
const CLOSING_SUGGESTIONS  = [2, 152, 237, 241, 249, 252];
const REST_SUGGESTIONS    = [30, 85, 89, 98, 136, 220, 292];

function getHymn(num) {
  if (num == null || num === "") return null;
  return HYMNS.find(h => h.number === Number(num)) || null;
}

Object.assign(window, {
  HYMNS, SACRAMENT_NUMS, OPENING_SUGGESTIONS, CLOSING_SUGGESTIONS, REST_SUGGESTIONS,
  getHymn,
});
