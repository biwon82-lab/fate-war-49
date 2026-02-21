import { TestSajuClient } from "./test-saju-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "운명전쟁49 - 로컬 테스트"
};

export default function TestPage() {
  return <TestSajuClient />;
}

