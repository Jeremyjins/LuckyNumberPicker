import type { Route } from "./+types/home";
import { LotteryMachine } from "~/components/lottery/LotteryMachine";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "행운번호 추첨기" },
    { name: "description", content: "간편하게 행운의 번호를 추첨하세요! 로또, 주사위, 빙고 등 다양한 번호 추첨기." },
    // Open Graph (KakaoTalk, Naver, Facebook 공유 미리보기)
    { property: "og:type", content: "website" },
    { property: "og:title", content: "행운번호 추첨기" },
    { property: "og:description", content: "간편하게 행운의 번호를 추첨하세요! 로또 6/45, 주사위, 빙고 등 다양한 설정 지원." },
    { property: "og:image", content: "/images/app_logo.png" },
    { property: "og:locale", content: "ko_KR" },
    // Twitter Card
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "행운번호 추첨기" },
    { name: "twitter:description", content: "간편하게 행운의 번호를 추첨하세요!" },
  ];
}

export default function Home() {
  return <LotteryMachine />;
}
