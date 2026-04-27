/* global React, TOURNAMENTS, TEAMS */

const { useState, useEffect } = React;

// ============================================================
// Shared community data — boards, posts, comments
// ============================================================

const BOARDS = [
  { id: 'notice',    name: '공지사항',    category: 'main',  count: 28,  new: false },
  { id: 'free',      name: '자유게시판',   category: 'main',  count: 1243, new: true },
  { id: 'match',     name: '매치구함',     category: 'play',  count: 487, new: true },
  { id: 'team',      name: '팀원모집',     category: 'play',  count: 214, new: true },
  { id: 'court',     name: '코트정보',     category: 'play',  count: 156, new: false },
  { id: 'review',    name: '대회후기',     category: 'play',  count: 92,  new: false },
  { id: 'gear',      name: '장비·굿즈',    category: 'chat',  count: 338, new: false },
  { id: 'skill',     name: '기술·훈련',    category: 'chat',  count: 176, new: true },
  { id: 'clip',      name: '영상·하이라이트', category: 'chat', count: 264, new: false },
  { id: 'qa',        name: '질문답변',     category: 'chat',  count: 512, new: false },
];

const POSTS = [
  { id: 201, board: 'notice', pinned: true,  title: '[공지] MyBDR 정식 오픈 — 다음카페에서 이관하신 분들께', author: '운영팀',    level: 'ADMIN',  date: '2026.04.18', views: 4821, comments: 128, hasImage: true,  isNew: false },
  { id: 200, board: 'notice', pinned: true,  title: '2026 BDR Challenge Spring 접수 시작 안내 (4/5까지)',    author: '운영팀',    level: 'ADMIN',  date: '2026.04.15', views: 2340, comments: 47,  hasImage: false, isNew: false },
  { id: 199, board: 'free',   pinned: false, title: '어제 장충체육관 픽업경기 후기 (사진 多)',                author: '리딤캡틴',   level: 'L.8',    date: '2026.04.20', views: 834,  comments: 32,  hasImage: true,  isNew: true  },
  { id: 198, board: 'match',  pinned: false, title: '[모집] 4/25 토요일 오후 3시 잠실 3대3 팀 구합니다',        author: '3POINT_슈',  level: 'L.5',    date: '2026.04.20', views: 421,  comments: 18,  hasImage: false, isNew: true  },
  { id: 197, board: 'review', pinned: false, title: 'Winter Finals 우승팀 인터뷰 — 몽키즈의 전략',            author: '기자단',    level: 'PRESS',  date: '2026.04.19', views: 1208, comments: 42,  hasImage: true,  isNew: true  },
  { id: 196, board: 'team',   pinned: false, title: '신생팀 피벗입니다. 포워드 1명 급구합니다',                author: 'PVT매니저', level: 'L.3',    date: '2026.04.19', views: 287,  comments: 11,  hasImage: false, isNew: true  },
  { id: 195, board: 'skill',  pinned: false, title: '스크린 디펜스 기초 — 5가지 포지셔닝',                    author: '코치K',    level: 'COACH',  date: '2026.04.19', views: 612,  comments: 24,  hasImage: true,  isNew: false },
  { id: 194, board: 'court',  pinned: false, title: '용산국민체육센터 4월 리노베이션 — 달라진 점 정리',         author: '코트지킴이', level: 'L.7',    date: '2026.04.18', views: 498,  comments: 16,  hasImage: true,  isNew: false },
  { id: 193, board: 'gear',   pinned: false, title: '쿠리 9 Low vs KD 16 — 3달 착화 리뷰',                   author: '장비덕후',  level: 'L.6',    date: '2026.04.18', views: 1142, comments: 54,  hasImage: true,  isNew: false },
  { id: 192, board: 'clip',   pinned: false, title: '[영상] 킹스크루 vs 더존 — 버저비터 3점',                  author: '편집자',    level: 'L.4',    date: '2026.04.17', views: 2340, comments: 88,  hasImage: true,  isNew: false },
  { id: 191, board: 'free',   pinned: false, title: 'MyBDR 앱 다크모드 너무 좋네요 의견',                    author: '야구도좋아', level: 'L.4',    date: '2026.04.17', views: 356,  comments: 29,  hasImage: false, isNew: false },
  { id: 190, board: 'qa',     pinned: false, title: '대회 신청 후 팀원 교체 가능한가요?',                     author: '새내기',    level: 'L.1',    date: '2026.04.17', views: 178,  comments: 8,   hasImage: false, isNew: false },
  { id: 189, board: 'match',  pinned: false, title: '[구함] 매주 수요일 저녁 픽업 — 성수동 근처',              author: 'wed_hooper',level: 'L.2',    date: '2026.04.16', views: 224,  comments: 7,   hasImage: false, isNew: false },
  { id: 188, board: 'review', pinned: false, title: 'Kings Cup Vol.07 예상 — 현재 판도 분석',                 author: '분석가',    level: 'L.9',    date: '2026.04.16', views: 892,  comments: 36,  hasImage: true,  isNew: false },
  { id: 187, board: 'free',   pinned: false, title: '농구화 세일 정보 공유 (ABC마트 4월)',                    author: '세일헌터',   level: 'L.3',    date: '2026.04.15', views: 467,  comments: 13,  hasImage: false, isNew: false },
];

// Sample post body for detail view
const POST_DETAIL = {
  id: 199,
  board: 'free',
  boardName: '자유게시판',
  title: '어제 장충체육관 픽업경기 후기 (사진 多)',
  author: '리딤캡틴',
  authorLevel: 'L.8',
  authorPosts: 412,
  date: '2026.04.20 21:34',
  views: 834,
  likes: 47,
  comments: 32,
  body: [
    { type: 'p', text: '어제 장충 다녀왔습니다. BDR Challenge 앞두고 몸 풀 겸 갔는데 생각보다 고수분들이 많이 오셔서 땀 제대로 흘리고 왔네요.' },
    { type: 'p', text: '5:30쯤 도착했는데 이미 코트 두 개가 돌아가고 있었습니다. 저희는 오른쪽 코트에서 3:3으로 4팀 돌아가면서 킹스룰로 진행했어요.' },
    { type: 'img', src: 'court', caption: '장충체육관 메인코트 · 조명 상태 최상' },
    { type: 'p', text: '제일 기억에 남는 건 마지막 세트. 2점 지고 있는 상황에서 우리 팀 가드가 탑에서 풀업 3점 꽂으면서 게임 끝냈습니다. 그 자리 있었던 분들 다 박수쳤어요.' },
    { type: 'h', text: '느낀 점' },
    { type: 'p', text: '1) 픽업이어도 수비 강도가 만만치 않다 — 특히 평일 저녁에 오시는 분들 수준이 올라온 게 체감됩니다.' },
    { type: 'p', text: '2) 체력 관리 필수. 저는 3세트 뛰고 다리 풀렸습니다.' },
    { type: 'p', text: '3) 신발 중요. 장충 바닥 생각보다 미끄러워요. 아웃솔 닳은 분들은 조심하세요.' },
    { type: 'p', text: '다음 주 수요일에도 갈 예정입니다. 같이 뛸 분 댓글 주세요!' },
  ],
};

const COMMENTS = [
  { id: 1, author: '3POINT_슈', level: 'L.5', date: '2026.04.20 21:52', body: '저도 어제 봤습니다! 마지막 3점 진짜 미쳤더라구요 ㅋㅋ', likes: 12, replies: [
    { id: 11, author: '리딤캡틴', level: 'L.8', date: '2026.04.20 22:01', body: '오 그 자리 계셨어요? 담엔 같이 뛰어요', likes: 3 },
  ]},
  { id: 2, author: '몽키즈_센', level: 'L.7', date: '2026.04.20 22:14', body: '다음주 수요일 저도 갑니다. 혹시 저녁 몇시쯤 모이세요?', likes: 4, replies: [] },
  { id: 3, author: '새내기',    level: 'L.1', date: '2026.04.21 08:22', body: '질문 있는데 픽업 가려면 예약 필요한가요? 처음 가봐서요', likes: 0, replies: [
    { id: 31, author: '코트지킴이', level: 'L.7', date: '2026.04.21 09:15', body: '장충은 무료입장이고 선착순입니다. 5시 전에 가시면 코트 잡기 편해요.', likes: 8 },
  ]},
  { id: 4, author: 'wed_hooper', level: 'L.2', date: '2026.04.21 09:40', body: '수요일 저녁 멤버 구합니다~ 성수에서도 함 뭉쳐요', likes: 1, replies: [] },
];

// Recent activity for home
const HOT_POSTS = POSTS.filter(p => p.views > 500).slice(0, 5);
const LATEST_POSTS = POSTS.filter(p => !p.pinned).slice(0, 8);

// Home stats
const HOME_STATS = {
  members: 12847,
  onlineNow: 342,
  postsToday: 87,
  tournaments: 6,
};

window.BOARDS = BOARDS;
window.POSTS = POSTS;
window.POST_DETAIL = POST_DETAIL;
window.COMMENTS = COMMENTS;
window.HOT_POSTS = HOT_POSTS;
window.LATEST_POSTS = LATEST_POSTS;
window.HOME_STATS = HOME_STATS;
