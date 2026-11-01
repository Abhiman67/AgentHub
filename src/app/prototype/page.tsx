import { readFile } from "node:fs/promises";
import { join } from "node:path";

export default async function PrototypePage() {
  const html = await readFile(join(process.cwd(), "student-workspace-prototype.html"), "utf8");
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  const styles = html.match(/<style[^>]*>([\s\S]*)<\/style>/i)?.[1] ?? "";
  return <><style dangerouslySetInnerHTML={{ __html: styles }} /><div dangerouslySetInnerHTML={{ __html: body }} /></>;
}
