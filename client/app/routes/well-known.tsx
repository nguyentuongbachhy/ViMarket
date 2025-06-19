import { type LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    console.log('Well-known request:', pathname);

    if (pathname === "/.well-known/appspecific/com.chrome.devtools.json") {
        return Response.json({
            "chrome-extension://gkojfkhlekighikafcpjkiklfbnlmeio": {
                "name": "React Developer Tools",
                "allowed": true
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400"
            }
        });
    }

    switch (pathname) {
        case "/.well-known/robots.txt":
            return new Response("User-agent: *\nDisallow:", {
                headers: { "Content-Type": "text/plain" }
            });

        case "/.well-known/security.txt":
            return new Response("Contact: admin@yoursite.com", {
                headers: { "Content-Type": "text/plain" }
            });

        default:
            throw new Response("Not Found", {
                status: 404,
                statusText: "Well-known resource not found"
            });
    }
}

export default function WellKnown() {
    return null;
}