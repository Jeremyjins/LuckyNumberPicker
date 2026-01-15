import type { Route } from "./+types/home";
import { LotteryMachine } from "~/components/lottery/LotteryMachine";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "행운번호 추첨기" },
    { name: "description", content: "간편하게 행운의 번호를 추첨하세요!" },
    { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
  ];
}

export default function Home() {
  return <LotteryMachine />;
}
