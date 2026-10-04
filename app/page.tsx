import fs from "node:fs";
import path from "node:path";
import LegacyRuntime from "./legacy-runtime";
import "./styles-main.css";
import "./globals.css";

function getPairDropMarkup() {
  const source = fs.readFileSync(path.join(process.cwd(), "public", "index.html"), "utf8");
  const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
  return body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

export default function Home() {
  return (
    <>
      <div id="pairdrop-root" dangerouslySetInnerHTML={{ __html: getPairDropMarkup() }} />
      <LegacyRuntime />
    </>
  );
}
