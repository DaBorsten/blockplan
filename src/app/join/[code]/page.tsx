import { redirect } from "next/navigation";

type Params = { params: { code: string } };

export default function JoinCodePage({ params }: Params) {
  const code = (params?.code || "").toString().toUpperCase();
  const target = code ? `/class/join?code=${encodeURIComponent(code)}` : "/class/join";
  redirect(target);
}
