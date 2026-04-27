/* global React */

// ============================================================
// MyBDR — Data (8 teams, tournaments, participants)
// ============================================================

const TEAMS = [
  { id: 'redeem',   name: '리딤',        tag: 'RDM',  color: '#E11D48', ink: '#fff', logo: null, founded: 2019, wins: 34, losses: 12, rating: 1842 },
  { id: '3point',   name: '3POINT',     tag: '3PT',  color: '#F59E0B', ink: '#000', logo: null, founded: 2020, wins: 28, losses: 15, rating: 1765 },
  { id: 'monkeys',  name: '몽키즈',       tag: 'MKZ',  color: '#10B981', ink: '#000', logo: null, founded: 2018, wins: 41, losses: 9,  rating: 1920 },
  { id: 'iron',     name: 'IRON WOLVES', tag: 'IRW',  color: '#6B7280', ink: '#fff', logo: null, founded: 2021, wins: 22, losses: 18, rating: 1640 },
  { id: 'zone',     name: 'THE ZONE',    tag: 'TZN',  color: '#8B5CF6', ink: '#fff', logo: null, founded: 2017, wins: 36, losses: 14, rating: 1810 },
  { id: 'heat',     name: 'SEOUL HEAT',  tag: 'SHT',  color: '#DC2626', ink: '#fff', logo: null, founded: 2022, wins: 19, losses: 11, rating: 1705 },
  { id: 'kings',    name: 'KINGS CREW',  tag: 'KGS',  color: '#0EA5E9', ink: '#fff', logo: null, founded: 2016, wins: 45, losses: 20, rating: 1880 },
  { id: 'pivot',    name: 'PIVOT',       tag: 'PVT',  color: '#EC4899', ink: '#fff', logo: null, founded: 2023, wins: 12, losses: 8,  rating: 1580 },
];

const TOURNAMENTS = [
  {
    id: 'bdr-challenge-spring-2026',
    title: 'BDR CHALLENGE',
    edition: 'SPRING 2026',
    subtitle: '서울 3x3 오픈 챔피언십',
    status: 'open',              // open | closing | closed | live | ended | preparing
    level: 'OPEN',               // OPEN | PRO | AMATEUR
    format: '3v3 · 더블엘리미네이션',
    prize: '₩5,000,000',
    fee: '₩80,000',
    feePerTeam: true,
    court: '장충체육관',
    address: '서울 중구 동호로 241',
    dates: '2026.04.11 ~ 04.12',
    period: '2026년 3월 15일 – 4월 5일',
    startAt: '2026-04-11T09:00:00+09:00',
    regOpenAt: '2026-03-15T10:00:00+09:00',
    regCloseAt: '2026-04-05T23:59:00+09:00',
    capacity: 16,
    applied: 12,
    waitlist: 0,
    host: 'BDR 리그 사무국',
    hostContact: '02-1234-5678',
    banner: null,
    poster: null,               // tournament poster image (logo/artwork) — optional
    accent: '#E31B23',
    tags: ['OPEN', '상금있음', '더블엘리', 'D-14'],
    recent: ['redeem', '3point', 'monkeys'],
  },
  {
    id: 'kings-cup-2026',
    title: 'KINGS CUP',
    edition: 'VOL. 07',
    subtitle: '왕좌는 하나다',
    status: 'closing',
    level: 'PRO',
    format: '5v5 · 싱글엘리미네이션',
    prize: '₩2,000,000',
    fee: '₩120,000',
    court: '올림픽체조경기장 보조구장',
    address: '서울 송파구 올림픽로 424',
    dates: '2026.03.28',
    period: '2026년 2월 20일 – 3월 20일',
    capacity: 8,
    applied: 7,
    tags: ['PRO', 'D-3', '마감임박'],
    accent: '#F59E0B',
    recent: ['kings', 'zone', 'monkeys'],
  },
  {
    id: 'friday-night-2026-03',
    title: 'FRIDAY NIGHT HOOPS',
    edition: 'MAR 2026',
    subtitle: '매주 금요일 밤 9시',
    status: 'open',
    level: 'AMATEUR',
    format: '3v3 · 리그전',
    prize: '트로피',
    fee: '₩30,000',
    court: '용산국민체육센터',
    dates: '2026.03.22',
    period: '상시 접수',
    capacity: 12,
    applied: 5,
    tags: ['AMATEUR', '상시'],
    accent: '#10B981',
    recent: ['pivot', 'iron', 'heat'],
  },
  {
    id: 'winter-final-2025',
    title: 'WINTER FINALS',
    edition: '2025',
    subtitle: '동계 결승전',
    status: 'ended',
    level: 'OPEN',
    format: '3v3 · 토너먼트',
    prize: '₩3,000,000',
    fee: '₩60,000',
    court: '잠실학생체육관',
    dates: '2025.12.14',
    period: '종료',
    capacity: 16,
    applied: 16,
    tags: ['OPEN', '종료'],
    accent: '#6B7280',
    winner: 'monkeys',
  },
  {
    id: 'heatwave-summer-2026',
    title: 'HEATWAVE',
    edition: 'SUMMER 2026',
    subtitle: '한여름의 농구',
    status: 'preparing',
    level: 'OPEN',
    format: '3v3 · 더블엘리미네이션',
    prize: '₩4,000,000',
    fee: '₩80,000',
    court: '양재체육관',
    dates: '2026.07.18 ~ 07.19',
    period: '5월 15일 접수 시작',
    capacity: 16,
    applied: 0,
    tags: ['OPEN', '접수예정'],
    accent: '#3B82F6',
  },
  {
    id: 'bdr-challenge-live',
    title: 'BDR CHALLENGE',
    edition: 'WINTER',
    subtitle: '지금 경기 중',
    status: 'live',
    level: 'OPEN',
    format: '3v3 · 더블엘리미네이션',
    prize: '₩3,000,000',
    fee: '₩60,000',
    court: '서울',
    dates: '2026.02.14',
    period: '진행중',
    capacity: 16,
    applied: 16,
    tags: ['OPEN', '경기중'],
    accent: '#E31B23',
  },
];

// Bracket: 8 teams for BDR CHALLENGE SPRING 2026 (example view)
const BRACKET_R16 = [
  { a: 'redeem',  b: 'pivot',   scoreA: null, scoreB: null, time: '04.11 09:00' },
  { a: 'monkeys', b: 'iron',    scoreA: null, scoreB: null, time: '04.11 10:00' },
  { a: '3point',  b: 'heat',    scoreA: null, scoreB: null, time: '04.11 11:00' },
  { a: 'kings',   b: 'zone',    scoreA: null, scoreB: null, time: '04.11 12:00' },
];

const SCHEDULE = [
  { date: '04.11 (토)', rows: [
    { time: '09:00', court: 'A', label: '16강 1경기', teams: ['redeem','pivot'] },
    { time: '10:00', court: 'A', label: '16강 2경기', teams: ['monkeys','iron'] },
    { time: '11:00', court: 'B', label: '16강 3경기', teams: ['3point','heat'] },
    { time: '12:00', court: 'B', label: '16강 4경기', teams: ['kings','zone'] },
    { time: '14:00', court: 'A', label: '8강 1경기', teams: [] },
    { time: '15:00', court: 'A', label: '8강 2경기', teams: [] },
  ]},
  { date: '04.12 (일)', rows: [
    { time: '10:00', court: 'A', label: '4강 1경기', teams: [] },
    { time: '11:00', court: 'A', label: '4강 2경기', teams: [] },
    { time: '14:00', court: 'A', label: '결승',     teams: [] },
  ]},
];

const MY_TEAM = { id: 'redeem', role: 'captain' }; // my view

window.BDR_DATA = { TEAMS, TOURNAMENTS, BRACKET_R16, SCHEDULE, MY_TEAM };
window.TEAMS = TEAMS;
window.TOURNAMENTS = TOURNAMENTS;
window.BRACKET_R16 = BRACKET_R16;
window.SCHEDULE = SCHEDULE;
window.MY_TEAM = MY_TEAM;
