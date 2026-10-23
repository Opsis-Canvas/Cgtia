// Two addresses, one site:
//   student.cgtia.com.ng  -> opens the student portal (the dashboard)
//   cgtia.com.ng          -> the main website
// Shared links to the portal also carry the portal's own preview image and title.
const PORTAL_TITLE = "CareEd · Student portal";
const PORTAL_DESCRIPTION = "Courses, results, attendance and notices, in one place.";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const onStudentHost = url.hostname.startsWith("student.");
  if (onStudentHost && (url.pathname === "/" || url.pathname === "")) {
    url.pathname = "/dashboard";
  }
  const isPortal = onStudentHost || url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/");
  const res = await context.next(new Request(url.toString(), context.request));
  const type = res.headers.get("content-type") || "";
  if (!isPortal || !type.includes("text/html")) return res;

  const image = url.origin + "/misc/og-portal.png";
  return new HTMLRewriter()
    .on('meta[property="og:image"]', { element(e) { e.setAttribute("content", image); } })
    .on('meta[name="twitter:image"]', { element(e) { e.setAttribute("content", image); } })
    .on('meta[property="og:title"]', { element(e) { e.setAttribute("content", PORTAL_TITLE); } })
    .on('meta[property="og:description"]', { element(e) { e.setAttribute("content", PORTAL_DESCRIPTION); } })
    .on("title", { element(e) { e.setInnerContent(PORTAL_TITLE); } })
    .transform(res);
}
