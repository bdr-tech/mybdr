/**
 * 농구 코트 시드 스크립트
 *
 * 전국 주요 농구장/체육관 80개를 시드 데이터로 삽입한다.
 * 실존하는 시설 이름과 대략적 좌표를 사용한다.
 * 기존 데이터와 이름이 겹치면 건너뛴다 (upsert 아님, 중복 체크 후 create).
 *
 * 실행: npx tsx scripts/seed-courts.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────
// 코트 시드 데이터 타입
// ─────────────────────────────────────────
interface CourtSeed {
  name: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  court_type: "indoor" | "outdoor";
  surface_type: string;
  hoops_count: number;
  has_lighting: boolean;
  is_free: boolean;
  fee?: number;
  description?: string;
}

// ─────────────────────────────────────────
// 전국 주요 농구장 데이터 (80개)
// ─────────────────────────────────────────
const COURTS: CourtSeed[] = [
  // ── 서울 (25개) ──
  {
    name: "잠실실내체육관",
    address: "서울 송파구 올림픽로 25",
    city: "서울", district: "송파구",
    latitude: 37.5132, longitude: 127.0726,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 15000,
    description: "KBL 프로농구 경기가 열리는 대형 실내체육관. 대관 예약 필요.",
  },
  {
    name: "장충체육관",
    address: "서울 중구 동호로 241",
    city: "서울", district: "중구",
    latitude: 37.5591, longitude: 127.0071,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 20000,
    description: "역사적인 실내체육관. 각종 농구 대회 개최.",
  },
  {
    name: "서울숲 야외 농구장",
    address: "서울 성동구 뚝섬로 273",
    city: "서울", district: "성동구",
    latitude: 37.5445, longitude: 127.0374,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 4, has_lighting: true, is_free: true,
    description: "서울숲 공원 내 야외 농구장. 조명 설비 완비.",
  },
  {
    name: "뚝섬 한강공원 농구장",
    address: "서울 광진구 강변북로 139",
    city: "서울", district: "광진구",
    latitude: 37.5310, longitude: 127.0660,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 4, has_lighting: true, is_free: true,
    description: "한강변 인기 야외 농구장. 주말 픽업게임 활발.",
  },
  {
    name: "올림픽공원 야외 농구장",
    address: "서울 송파구 올림픽로 424",
    city: "서울", district: "송파구",
    latitude: 37.5209, longitude: 127.1144,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 6, has_lighting: true, is_free: true,
    description: "올림픽공원 내 대규모 야외 농구장. 풀코트 3면.",
  },
  {
    name: "보라매공원 농구장",
    address: "서울 동작구 여의대방로20길 33",
    city: "서울", district: "동작구",
    latitude: 37.4934, longitude: 126.9157,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 4, has_lighting: true, is_free: true,
    description: "보라매공원 내 야외 농구장.",
  },
  {
    name: "하늘공원 농구장",
    address: "서울 마포구 하늘공원로 95",
    city: "서울", district: "마포구",
    latitude: 37.5685, longitude: 126.8854,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: false, is_free: true,
    description: "월드컵공원 내 소규모 야외 코트.",
  },
  {
    name: "여의도공원 농구장",
    address: "서울 영등포구 여의공원로 68",
    city: "서울", district: "영등포구",
    latitude: 37.5264, longitude: 126.9228,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 4, has_lighting: true, is_free: true,
    description: "여의도 직장인들이 많이 찾는 야외 농구장.",
  },
  {
    name: "양재시민의숲 농구장",
    address: "서울 서초구 매헌로 99",
    city: "서울", district: "서초구",
    latitude: 37.4720, longitude: 127.0390,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "중랑캠핑숲 농구장",
    address: "서울 중랑구 망우로87길 110",
    city: "서울", district: "중랑구",
    latitude: 37.5967, longitude: 127.0910,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 2, has_lighting: false, is_free: true,
  },
  {
    name: "강서구민체육센터",
    address: "서울 강서구 공항대로 579",
    city: "서울", district: "강서구",
    latitude: 37.5596, longitude: 126.8365,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
    description: "강서구 종합체육시설. 농구장 대관 가능.",
  },
  {
    name: "마포구민체육센터",
    address: "서울 마포구 월드컵북로 167",
    city: "서울", district: "마포구",
    latitude: 37.5549, longitude: 126.9107,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 6000,
  },
  {
    name: "도봉산 야외 농구장",
    address: "서울 도봉구 도봉산길 86",
    city: "서울", district: "도봉구",
    latitude: 37.6612, longitude: 127.0150,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 2, has_lighting: false, is_free: true,
  },
  {
    name: "노원구민체육센터",
    address: "서울 노원구 동일로 1414",
    city: "서울", district: "노원구",
    latitude: 37.6518, longitude: 127.0568,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },
  {
    name: "관악구민운동장 농구장",
    address: "서울 관악구 관악로 145",
    city: "서울", district: "관악구",
    latitude: 37.4784, longitude: 126.9516,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "성북구민체육센터",
    address: "서울 성북구 화랑로 90",
    city: "서울", district: "성북구",
    latitude: 37.6038, longitude: 127.0115,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },
  {
    name: "용산가족공원 농구장",
    address: "서울 용산구 서빙고로 137",
    city: "서울", district: "용산구",
    latitude: 37.5240, longitude: 126.9732,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "구로구민체육센터",
    address: "서울 구로구 구로중앙로 258",
    city: "서울", district: "구로구",
    latitude: 37.4942, longitude: 126.8876,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },
  {
    name: "잠원 한강공원 농구장",
    address: "서울 서초구 잠원로 221",
    city: "서울", district: "서초구",
    latitude: 37.5170, longitude: 127.0020,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
    description: "한강변 농구장. 야간 조명 있어 저녁 운동 가능.",
  },
  {
    name: "광나루 한강공원 농구장",
    address: "서울 강동구 선사로 83",
    city: "서울", district: "강동구",
    latitude: 37.5476, longitude: 127.1107,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 4, has_lighting: true, is_free: true,
  },
  {
    name: "강남구민체육센터",
    address: "서울 강남구 밤고개로 1길 10",
    city: "서울", district: "강남구",
    latitude: 37.4969, longitude: 127.0631,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 8000,
    description: "강남 최대 규모 실내 농구장. 대관 및 개인 이용 가능.",
  },
  {
    name: "은평구민체육센터",
    address: "서울 은평구 진관길 61",
    city: "서울", district: "은평구",
    latitude: 37.6345, longitude: 126.9297,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },
  {
    name: "동대문구민체육센터",
    address: "서울 동대문구 천호대로 445",
    city: "서울", district: "동대문구",
    latitude: 37.5751, longitude: 127.0561,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },
  {
    name: "송파구민체육센터",
    address: "서울 송파구 백제고분로 191",
    city: "서울", district: "송파구",
    latitude: 37.5085, longitude: 127.0936,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 6000,
  },
  {
    name: "반포 한강공원 농구장",
    address: "서울 서초구 신반포로11길 40",
    city: "서울", district: "서초구",
    latitude: 37.5098, longitude: 126.9957,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },

  // ── 경기 (15개) ──
  {
    name: "스포라운드 남양주",
    address: "경기 남양주시 다산중앙로 82",
    city: "경기", district: "남양주시",
    latitude: 37.6110, longitude: 127.1540,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 4, has_lighting: true, is_free: false, fee: 10000,
    description: "대규모 실내 농구 시설. 풀코트 2면. BDR 대회 개최.",
  },
  {
    name: "안양종합운동장 체육관",
    address: "경기 안양시 만안구 예술공원로 164",
    city: "경기", district: "안양시",
    latitude: 37.3886, longitude: 126.9225,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 10000,
  },
  {
    name: "수원종합운동장 실내체육관",
    address: "경기 수원시 장안구 경수대로 893",
    city: "경기", district: "수원시",
    latitude: 37.2976, longitude: 127.0087,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 12000,
  },
  {
    name: "부천체육관",
    address: "경기 부천시 길주로 210",
    city: "경기", district: "부천시",
    latitude: 37.5039, longitude: 126.7614,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 10000,
  },
  {
    name: "일산호수공원 농구장",
    address: "경기 고양시 일산동구 호수로 595",
    city: "경기", district: "고양시",
    latitude: 37.6670, longitude: 126.7700,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 4, has_lighting: true, is_free: true,
    description: "일산호수공원 내 인기 야외 농구장.",
  },
  {
    name: "분당중앙공원 농구장",
    address: "경기 성남시 분당구 정자일로 1",
    city: "경기", district: "성남시",
    latitude: 37.3710, longitude: 127.1130,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "광교호수공원 농구장",
    address: "경기 수원시 영통구 광교호수로 57",
    city: "경기", district: "수원시",
    latitude: 37.2850, longitude: 127.0530,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: false, is_free: true,
  },
  {
    name: "용인시민체육공원 농구장",
    address: "경기 용인시 처인구 중부대로 1199",
    city: "경기", district: "용인시",
    latitude: 37.2340, longitude: 127.2010,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "화성종합경기타운 체육관",
    address: "경기 화성시 봉담읍 동화길 51",
    city: "경기", district: "화성시",
    latitude: 37.2126, longitude: 126.9520,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 8000,
  },
  {
    name: "파주운정 야외 농구장",
    address: "경기 파주시 운정로 57",
    city: "경기", district: "파주시",
    latitude: 37.7146, longitude: 126.7600,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "평택시민체육관",
    address: "경기 평택시 비전5로 36",
    city: "경기", district: "평택시",
    latitude: 37.0040, longitude: 127.1000,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 8000,
  },
  {
    name: "김포 한강중앙공원 농구장",
    address: "경기 김포시 김포한강9로 17",
    city: "경기", district: "김포시",
    latitude: 37.6310, longitude: 126.6980,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "의정부실내체육관",
    address: "경기 의정부시 시민로 30",
    city: "경기", district: "의정부시",
    latitude: 37.7388, longitude: 127.0337,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 8000,
  },
  {
    name: "광명시민체육관",
    address: "경기 광명시 시청로 110",
    city: "경기", district: "광명시",
    latitude: 37.4789, longitude: 126.8642,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 7000,
  },
  {
    name: "양주시민체육공원 농구장",
    address: "경기 양주시 부흥로 1731",
    city: "경기", district: "양주시",
    latitude: 37.7850, longitude: 127.0450,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 2, has_lighting: false, is_free: true,
  },

  // ── 인천 (8개) ──
  {
    name: "인천삼산월드체육관",
    address: "인천 부평구 무네미로 278",
    city: "인천", district: "부평구",
    latitude: 37.5156, longitude: 126.7217,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 15000,
    description: "KBL 프로농구 인천 홈구장. 대형 실내체육관.",
  },
  {
    name: "송도 센트럴파크 농구장",
    address: "인천 연수구 컨벤시아대로 160",
    city: "인천", district: "연수구",
    latitude: 37.3823, longitude: 126.6614,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 4, has_lighting: true, is_free: true,
    description: "송도 센트럴파크 내 야외 농구장. 야경이 아름다운 곳.",
  },
  {
    name: "인천대공원 농구장",
    address: "인천 남동구 장수동 산79",
    city: "인천", district: "남동구",
    latitude: 37.4443, longitude: 126.7551,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 2, has_lighting: false, is_free: true,
  },
  {
    name: "계양체육관",
    address: "인천 계양구 계양산로 102",
    city: "인천", district: "계양구",
    latitude: 37.5374, longitude: 126.7352,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 6000,
  },
  {
    name: "검단신도시 농구장",
    address: "인천 서구 검단로 167",
    city: "인천", district: "서구",
    latitude: 37.5940, longitude: 126.6680,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "미추홀구민체육센터",
    address: "인천 미추홀구 인하로 311",
    city: "인천", district: "미추홀구",
    latitude: 37.4500, longitude: 126.6570,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },
  {
    name: "청라호수공원 농구장",
    address: "인천 서구 에코로 181",
    city: "인천", district: "서구",
    latitude: 37.5360, longitude: 126.6520,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "남동구민체육관",
    address: "인천 남동구 구월로 113",
    city: "인천", district: "남동구",
    latitude: 37.4506, longitude: 126.7306,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 6000,
  },

  // ── 부산 (8개) ──
  {
    name: "사직실내체육관",
    address: "부산 동래구 사직로 45",
    city: "부산", district: "동래구",
    latitude: 35.1929, longitude: 129.0618,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 15000,
    description: "KBL 부산 홈구장. 대규모 농구 대회 개최.",
  },
  {
    name: "해운대 해변공원 농구장",
    address: "부산 해운대구 해운대해변로 264",
    city: "부산", district: "해운대구",
    latitude: 35.1590, longitude: 129.1604,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 2, has_lighting: true, is_free: true,
    description: "해운대 해변 근처 야외 농구장. 바다 뷰가 매력.",
  },
  {
    name: "부산시민공원 농구장",
    address: "부산 부산진구 시민공원로 73",
    city: "부산", district: "부산진구",
    latitude: 35.1685, longitude: 129.0510,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 4, has_lighting: true, is_free: true,
  },
  {
    name: "강서구민체육센터 부산",
    address: "부산 강서구 낙동북로 477",
    city: "부산", district: "강서구",
    latitude: 35.1170, longitude: 128.9520,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },
  {
    name: "남구체육관",
    address: "부산 남구 못골로 15",
    city: "부산", district: "남구",
    latitude: 35.1350, longitude: 129.0840,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 6000,
  },
  {
    name: "센텀시티 야외 농구장",
    address: "부산 해운대구 센텀중앙로 48",
    city: "부산", district: "해운대구",
    latitude: 35.1692, longitude: 129.1316,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "사상구민체육관",
    address: "부산 사상구 낙동대로 1400",
    city: "부산", district: "사상구",
    latitude: 35.1520, longitude: 128.9830,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },
  {
    name: "기장군민체육관",
    address: "부산 기장군 기장읍 차성남로 68",
    city: "부산", district: "기장군",
    latitude: 35.2440, longitude: 129.2220,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },

  // ── 대구 (5개) ──
  {
    name: "대구체육관",
    address: "대구 수성구 알파시티1로 200",
    city: "대구", district: "수성구",
    latitude: 35.8363, longitude: 128.6321,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 12000,
  },
  {
    name: "두류공원 농구장",
    address: "대구 달서구 공원순환로 36",
    city: "대구", district: "달서구",
    latitude: 35.8532, longitude: 128.5679,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 4, has_lighting: true, is_free: true,
  },
  {
    name: "수성못 농구장",
    address: "대구 수성구 두산동로 17",
    city: "대구", district: "수성구",
    latitude: 35.8280, longitude: 128.6190,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 2, has_lighting: false, is_free: true,
  },
  {
    name: "북구체육관",
    address: "대구 북구 학정로 101",
    city: "대구", district: "북구",
    latitude: 35.9120, longitude: 128.5830,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },
  {
    name: "달성공원 농구장",
    address: "대구 중구 달성공원로 35",
    city: "대구", district: "중구",
    latitude: 35.8714, longitude: 128.5830,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 2, has_lighting: false, is_free: true,
  },

  // ── 광주 (5개) ──
  {
    name: "광주염주체육관",
    address: "광주 서구 금화로 278",
    city: "광주", district: "서구",
    latitude: 35.1404, longitude: 126.8898,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 10000,
  },
  {
    name: "광주월드컵경기장 농구장",
    address: "광주 서구 금화로 240",
    city: "광주", district: "서구",
    latitude: 35.1335, longitude: 126.8817,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 4, has_lighting: true, is_free: true,
  },
  {
    name: "무등산 농구장",
    address: "광주 동구 필문대로 309",
    city: "광주", district: "동구",
    latitude: 35.1312, longitude: 126.9580,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 2, has_lighting: false, is_free: true,
  },
  {
    name: "북구 시민체육관",
    address: "광주 북구 북문대로 200",
    city: "광주", district: "북구",
    latitude: 35.1820, longitude: 126.9120,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },
  {
    name: "광산구민체육센터",
    address: "광주 광산구 소촌로 78",
    city: "광주", district: "광산구",
    latitude: 35.1410, longitude: 126.8030,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },

  // ── 대전 (5개) ──
  {
    name: "대전충무체육관",
    address: "대전 중구 대종로 373",
    city: "대전", district: "중구",
    latitude: 36.3224, longitude: 127.4187,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 12000,
  },
  {
    name: "한밭수목원 농구장",
    address: "대전 서구 둔산대로 169",
    city: "대전", district: "서구",
    latitude: 36.3629, longitude: 127.3886,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "유성구민체육관",
    address: "대전 유성구 엑스포로 1",
    city: "대전", district: "유성구",
    latitude: 36.3742, longitude: 127.3914,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 6000,
  },
  {
    name: "대전엑스포시민광장 농구장",
    address: "대전 유성구 대덕대로 480",
    city: "대전", district: "유성구",
    latitude: 36.3738, longitude: 127.3862,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 4, has_lighting: true, is_free: true,
  },
  {
    name: "동구체육관",
    address: "대전 동구 동서대로 1688",
    city: "대전", district: "동구",
    latitude: 36.3330, longitude: 127.4540,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },

  // ── 울산/세종/제주 (9개) ──
  {
    name: "울산동천체육관",
    address: "울산 남구 돋질로 233",
    city: "울산", district: "남구",
    latitude: 35.5371, longitude: 129.3113,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 8000,
  },
  {
    name: "태화강 국가정원 농구장",
    address: "울산 중구 태화로 300",
    city: "울산", district: "중구",
    latitude: 35.5520, longitude: 129.3050,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "울산문수체육공원 농구장",
    address: "울산 남구 문수로 44",
    city: "울산", district: "남구",
    latitude: 35.5340, longitude: 129.2730,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 4, has_lighting: true, is_free: true,
  },
  {
    name: "세종호수공원 농구장",
    address: "세종 다솜로 216",
    city: "세종", district: "세종시",
    latitude: 36.5040, longitude: 127.0040,
    court_type: "outdoor", surface_type: "우레탄",
    hoops_count: 2, has_lighting: true, is_free: true,
  },
  {
    name: "세종시민체육관",
    address: "세종 보듬4로 96",
    city: "세종", district: "세종시",
    latitude: 36.5109, longitude: 127.0095,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 5000,
  },
  {
    name: "제주종합경기장 체육관",
    address: "제주 제주시 서광로 215",
    city: "제주", district: "제주시",
    latitude: 33.4506, longitude: 126.5670,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 8000,
  },
  {
    name: "서귀포체육관",
    address: "제주 서귀포시 중앙로 65",
    city: "제주", district: "서귀포시",
    latitude: 33.2541, longitude: 126.5606,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 6000,
  },
  {
    name: "탑동 해변 농구장",
    address: "제주 제주시 탑동로 2",
    city: "제주", district: "제주시",
    latitude: 33.5172, longitude: 126.5270,
    court_type: "outdoor", surface_type: "콘크리트",
    hoops_count: 2, has_lighting: true, is_free: true,
    description: "바다가 보이는 야외 농구장. 제주 핫플.",
  },
  {
    name: "한라체육관",
    address: "제주 제주시 연삼로 65",
    city: "제주", district: "제주시",
    latitude: 33.4660, longitude: 126.5410,
    court_type: "indoor", surface_type: "마루",
    hoops_count: 2, has_lighting: true, is_free: false, fee: 8000,
  },
];

// ─────────────────────────────────────────
// 메인 실행
// ─────────────────────────────────────────
async function main() {
  console.log(`총 ${COURTS.length}개 코트 시드 시작...`);

  // 기존 코트 이름 조회 (중복 방지)
  const existing = await prisma.court_infos.findMany({
    select: { name: true },
  });
  const existingNames = new Set(existing.map((c) => c.name));

  // user_id 1번 사용자 확인 (시드 데이터 소유자)
  // isAdmin이 true인 사용자를 찾고, 없으면 id=1 사용
  const adminUser = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { id: true },
  });
  const userId = adminUser?.id ?? BigInt(1);

  let created = 0;
  let skipped = 0;
  const now = new Date();

  for (const court of COURTS) {
    // 이름 중복이면 건너뜀
    if (existingNames.has(court.name)) {
      console.log(`  [건너뜀] ${court.name} (이미 존재)`);
      skipped++;
      continue;
    }

    await prisma.court_infos.create({
      data: {
        user_id: userId,
        name: court.name,
        description: court.description ?? null,
        address: court.address,
        city: court.city,
        district: court.district,
        latitude: court.latitude,
        longitude: court.longitude,
        court_type: court.court_type,
        hoops_count: court.hoops_count,
        surface_type: court.surface_type,
        is_free: court.is_free,
        fee: court.fee ?? null,
        has_lighting: court.has_lighting,
        data_source: "seed",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    });

    console.log(`  [생성] ${court.name} (${court.city} ${court.district})`);
    created++;
  }

  console.log(`\n완료: 생성 ${created}개, 건너뜀 ${skipped}개`);
}

main()
  .catch((e) => {
    console.error("시드 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
