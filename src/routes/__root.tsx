import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createIsomorphicFn } from "@tanstack/react-start";
import {
	getRequestHost,
	getRequestProtocol,
} from "@tanstack/react-start/server";

import appCss from "../styles.css?url";

// Absolute origin for social-preview images (og:image / twitter:image),
// derived per request: from the Host header on the server, window.location on
// the client. No build-time or runtime env var to configure — it's correct on
// whatever domain serves the page.
const getOrigin = createIsomorphicFn()
	.server(
		() =>
			`${getRequestProtocol({ xForwardedProto: true })}://${getRequestHost({ xForwardedHost: true })}`,
	)
	.client(() => window.location.origin);

export const Route = createRootRoute({
	loader: () => ({ origin: getOrigin() }),
	head: ({ loaderData }) => {
		const ogImage = `${loaderData?.origin ?? ""}/og.png`;
		return {
			meta: [
				{ charSet: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ title: "Super Banana Bros" },
				{
					name: "description",
					content:
						"A potassium-boosting, Mario-style platformer starring a banana. Deployed with Suga.",
				},
				{ property: "og:type", content: "website" },
				{ property: "og:title", content: "Super Banana Bros" },
				{
					property: "og:description",
					content:
						"A potassium-boosting masterpiece. Free to play in your browser.",
				},
				{ property: "og:image", content: ogImage },
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:title", content: "Super Banana Bros" },
				{
					name: "twitter:description",
					content:
						"A potassium-boosting masterpiece. Free to play in your browser.",
				},
				{ name: "twitter:image", content: ogImage },
			],
			links: [
				{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
				{ rel: "preconnect", href: "https://fonts.googleapis.com" },
				{
					rel: "preconnect",
					href: "https://fonts.gstatic.com",
					crossOrigin: "anonymous",
				},
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap",
				},
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap",
				},
				{ rel: "stylesheet", href: appCss },
			],
		};
	},
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
