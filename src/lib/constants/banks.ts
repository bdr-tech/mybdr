/** 금융결제원 표준 은행 코드 (20개 주요 은행) */
export const BANKS = [
  { label: "KB국민은행",   value: "004" },
  { label: "신한은행",     value: "088" },
  { label: "우리은행",     value: "020" },
  { label: "하나은행",     value: "081" },
  { label: "NH농협은행",   value: "011" },
  { label: "IBK기업은행",  value: "003" },
  { label: "카카오뱅크",   value: "090" },
  { label: "케이뱅크",    value: "089" },
  { label: "토스뱅크",    value: "092" },
  { label: "SC제일은행",   value: "023" },
  { label: "씨티은행",    value: "027" },
  { label: "부산은행",    value: "032" },
  { label: "경남은행",    value: "039" },
  { label: "광주은행",    value: "034" },
  { label: "전북은행",    value: "037" },
  { label: "제주은행",    value: "035" },
  { label: "DGB대구은행",  value: "031" },
  { label: "우체국",      value: "071" },
  { label: "새마을금고",   value: "045" },
  { label: "신협",        value: "048" },
] as const;

export type BankValue = (typeof BANKS)[number]["value"];
