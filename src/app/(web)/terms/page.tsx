import Link from "next/link";

export const metadata = {
  title: "서비스 이용약관 | MyBDR",
  description: "MyBDR 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827]">서비스 이용약관</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">시행일: 2025년 1월 1일 · 최종 수정: 2026년 3월 1일</p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed text-[#374151]">

        {/* 제1조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제1조 (목적)</h2>
          <p>
            이 약관은 MyBDR(이하 &quot;서비스&quot;)을 운영하는 BDR(이하 &quot;회사&quot;)이 제공하는
            농구 경기·대회·팀 매칭 플랫폼 서비스의 이용과 관련하여 회사와 이용자 간의 권리·의무 및
            책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        {/* 제2조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제2조 (정의)</h2>
          <ul className="space-y-2">
            <li>
              <span className="font-medium">① 서비스</span>: 회사가 제공하는 MyBDR 플랫폼
              (mybdr.kr) 및 이와 연동된 모바일 앱·API를 통해 제공되는 모든 기능을 말합니다.
            </li>
            <li>
              <span className="font-medium">② 이용자</span>: 이 약관에 동의하고 서비스를 이용하는
              회원 및 비회원을 말합니다.
            </li>
            <li>
              <span className="font-medium">③ 회원</span>: 회사에 개인정보를 제공하여 계정을
              등록하고 서비스를 이용하는 자를 말합니다.
            </li>
            <li>
              <span className="font-medium">④ 콘텐츠</span>: 회원이 서비스 내에 게시한 경기·대회·팀
              정보, 사진, 텍스트 등 모든 자료를 말합니다.
            </li>
          </ul>
        </section>

        {/* 제3조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제3조 (약관의 효력 및 변경)</h2>
          <ul className="space-y-2">
            <li>① 이 약관은 서비스 화면에 게시하거나 이메일 등으로 공지함으로써 효력이 발생합니다.</li>
            <li>
              ② 회사는 관련 법령을 위반하지 않는 범위 내에서 약관을 변경할 수 있으며,
              변경 시 시행일 7일 전(중요 사항은 30일 전)에 공지합니다.
            </li>
            <li>③ 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
          </ul>
        </section>

        {/* 제4조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제4조 (서비스 내용)</h2>
          <p className="mb-2">회사는 다음과 같은 서비스를 제공합니다.</p>
          <ul className="space-y-1 pl-4">
            <li>• 픽업게임, 게스트 모집, 팀 대결 등 농구 경기 매칭 서비스</li>
            <li>• 농구 대회 개설 및 운영(토너먼트·리그) 서비스</li>
            <li>• 팀 생성 및 선수 모집 서비스</li>
            <li>• 코트 정보 제공 서비스</li>
            <li>• 유료 구독 서비스 (요금제 페이지 참고)</li>
            <li>• 기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
          </ul>
        </section>

        {/* 제5조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제5조 (이용계약의 성립)</h2>
          <ul className="space-y-2">
            <li>① 이용계약은 이용자가 이 약관에 동의한 후 서비스에 가입하면 성립합니다.</li>
            <li>
              ② 회사는 다음 각 호에 해당하는 경우 가입 신청을 거부하거나 사후에 이용계약을
              해지할 수 있습니다.
            </li>
            <ul className="mt-1 space-y-1 pl-4">
              <li>• 타인의 명의를 도용하거나 허위 정보를 기재한 경우</li>
              <li>• 14세 미만인 경우 (법정대리인 동의 없이 가입 시)</li>
              <li>• 이전에 이용 제한을 받은 경우</li>
            </ul>
          </ul>
        </section>

        {/* 제6조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제6조 (회원의 의무)</h2>
          <p className="mb-2">회원은 다음 행위를 하여서는 안 됩니다.</p>
          <ul className="space-y-1 pl-4">
            <li>• 타인의 정보 도용 또는 허위 사실 게시</li>
            <li>• 음란·폭력·혐오 등 불법·유해 콘텐츠 게시</li>
            <li>• 서비스의 정상 운영을 방해하는 행위 (스팸, DDoS, 크롤링 등)</li>
            <li>• 경기·대회에 신청 후 정당한 사유 없이 무단 불참</li>
            <li>• 회사의 사전 승인 없는 상업적 광고·홍보 행위</li>
            <li>• 관련 법령 및 이 약관에서 금지하는 모든 행위</li>
          </ul>
        </section>

        {/* 제7조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제7조 (서비스 이용 제한)</h2>
          <ul className="space-y-2">
            <li>
              ① 회사는 회원이 제6조를 위반한 경우 경고·일시정지·영구정지 등의 조치를 취할 수 있습니다.
            </li>
            <li>
              ② 서비스 이용 제한에 이의가 있는 경우 회사 이메일
              ({" "}
              <a href="mailto:bdr.wonyoung@gmail.com" className="text-[#F4A261] underline underline-offset-2">
                bdr.wonyoung@gmail.com
              </a>
              {" "})로 이의를 제기할 수 있습니다.
            </li>
          </ul>
        </section>

        {/* 제8조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제8조 (콘텐츠의 권리)</h2>
          <ul className="space-y-2">
            <li>① 회원이 서비스 내에 게시한 콘텐츠의 저작권은 해당 회원에게 있습니다.</li>
            <li>
              ② 회원은 서비스 게시 콘텐츠에 대해 회사가 서비스 운영·개선·홍보 목적으로
              무상 사용·복제·배포할 수 있는 권리를 부여합니다.
            </li>
            <li>③ 회원은 타인의 저작권을 침해하는 콘텐츠를 게시해서는 안 됩니다.</li>
          </ul>
        </section>

        {/* 제9조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제9조 (서비스 중단 및 변경)</h2>
          <ul className="space-y-2">
            <li>
              ① 회사는 시스템 점검·장애·천재지변 등 불가피한 사유로 서비스를 일시 중단할 수 있으며,
              사전 또는 사후에 공지합니다.
            </li>
            <li>
              ② 회사는 서비스의 내용·기능·요금을 변경하거나 서비스를 종료할 수 있으며,
              이 경우 사전에 공지합니다.
            </li>
          </ul>
        </section>

        {/* 제10조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제10조 (개인정보 보호)</h2>
          <p>
            회사는 이용자의 개인정보를{" "}
            <Link href="/privacy" className="text-[#F4A261] underline underline-offset-2">
              개인정보 처리방침
            </Link>
            에 따라 처리합니다. 개인정보 처리방침은 서비스 화면에서 언제든지 확인할 수 있습니다.
          </p>
        </section>

        {/* 제11조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제11조 (면책조항)</h2>
          <ul className="space-y-2">
            <li>
              ① 회사는 천재지변·전쟁·인터넷 장애 등 불가항력으로 인한 서비스 제공 불가에 대해
              책임지지 않습니다.
            </li>
            <li>② 회사는 회원 간 거래·분쟁에서 발생하는 손해에 대해 책임지지 않습니다.</li>
            <li>
              ③ 회원이 서비스 내에서 게시한 정보의 정확성·신뢰성에 대해 회사는 보증하지 않습니다.
            </li>
            <li>
              ④ 서비스를 통해 신청한 경기·대회 참가 중 발생하는 신체적 부상 및 사고에 대해 회사는
              책임지지 않습니다. 참가자 본인이 안전에 유의하시기 바랍니다.
            </li>
          </ul>
        </section>

        {/* 제12조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제12조 (유료 서비스 및 환불)</h2>
          <ul className="space-y-2">
            <li>① 유료 서비스의 요금·결제 방법은 서비스 내 요금 안내 페이지에 따릅니다.</li>
            <li>
              ② 유료 구독의 환불은 결제일로부터 7일 이내, 서비스를 이용하지 않은 경우에 한해 전액 환불합니다.
              단, 이미 서비스를 이용한 경우 이용분을 제외한 잔여금액을 환불합니다.
            </li>
            <li>③ 환불 요청은 회사 이메일로 문의하시기 바랍니다.</li>
          </ul>
        </section>

        {/* 제13조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#111827]">제13조 (준거법 및 분쟁 해결)</h2>
          <ul className="space-y-2">
            <li>① 이 약관은 대한민국 법률에 따라 해석·적용됩니다.</li>
            <li>
              ② 서비스 이용과 관련하여 분쟁이 발생하면 회사와 이용자는 성실히 협의합니다.
              협의가 이루어지지 않을 경우 회사 소재지 관할 법원에 소를 제기할 수 있습니다.
            </li>
          </ul>
        </section>

        {/* 부칙 */}
        <section className="rounded-[16px] border border-[#E8ECF0] bg-[#F5F7FA] p-5">
          <h2 className="mb-2 text-base font-semibold text-[#111827]">부칙</h2>
          <p>이 약관은 2026년 3월 1일부터 시행합니다.</p>
        </section>

      </div>

      {/* 하단 링크 */}
      <div className="mt-10 flex items-center gap-4 border-t border-[#E8ECF0] pt-6 text-sm text-[#9CA3AF]">
        <Link href="/privacy" className="hover:text-[#6B7280]">개인정보 처리방침</Link>
        <span>·</span>
        <a href="mailto:bdr.wonyoung@gmail.com" className="hover:text-[#6B7280]">문의: bdr.wonyoung@gmail.com</a>
        <span>·</span>
        <Link href="/" className="hover:text-[#6B7280]">홈으로</Link>
      </div>
    </div>
  );
}
