// ✏️  The personal part of the gift. Edit the values below — everything else reads from here.
// (Sample values for the public demo.)
//
// Preview any day without waiting for it, e.g. http://localhost:5173/vi?day=02-14
//   ?day=MM-DD     pretends today is that date (to check a special day)
//
// The welcome screen shows every time the site opens.

export type Effect = 'hearts' | 'none';

export interface SpecialDay {
  /** "MM-DD" */
  date: string;
  title: string;
  message: string;
  effect: Effect;
}

export const GIFT = {
  /** How the site greets the person it was made for. */
  name: 'Alex',
  /** Signature under the messages. */
  from: 'Sam',
  /** The day you got together ("YYYY-MM-DD"); powers the day counter and the anniversary. Set to '' to hide. */
  together: '2023-04-01',
  /** Their birthday ("MM-DD"). Set to '' to skip. */
  birthday: '09-12',

  /** Shown on ordinary days, one picked per day. */
  dailyMessages: [
    'Hôm nay xem phim gì cùng nhau nè?',
    'Rạp phim nhỏ này mở cửa chỉ vì Alex thôi đó.',
    'Chọn một phim thật hay, rồi kể nghe nha.',
    'Xem phim xong nhớ ngủ sớm nha.',
  ],

  anniversary: {
    title: 'Kỷ niệm {years} năm bên nhau',
    message: 'Cảm ơn vì đã ở bên nhau suốt {days} ngày qua. Mình xem một bộ phim thật đẹp hôm nay nhé.',
  },
  birthdayGreeting: {
    title: 'Chúc mừng sinh nhật {name}!',
    message: 'Chúc tuổi mới thật nhiều niềm vui. Hôm nay rạp phim là của riêng {name}.',
  },

  /** Fixed yearly days. Add, remove or rewrite freely. */
  specialDays: [
    { date: '02-14', title: 'Happy Valentine’s Day', message: 'Valentine này mình chọn một phim tình cảm thật ngọt nhé.', effect: 'hearts' },
    { date: '03-08', title: 'Chúc mừng ngày 8/3', message: 'Chúc một ngày thật rạng rỡ.', effect: 'hearts' },
    { date: '10-20', title: 'Chúc mừng ngày 20/10', message: 'Chúc một ngày thật vui, được yêu thương và chiều chuộng.', effect: 'hearts' },
    { date: '12-24', title: 'Merry Christmas', message: 'Đêm Giáng sinh ấm áp, mình cùng xem một phim thật hay nhé.', effect: 'hearts' },
  ] satisfies SpecialDay[],
};
