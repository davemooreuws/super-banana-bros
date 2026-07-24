import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Super Banana Bros",
			},
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
			{ property: "og:image", content: "/og.png" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: "Super Banana Bros" },
			{
				name: "twitter:description",
				content:
					"A potassium-boosting masterpiece. Free to play in your browser.",
			},
			{ name: "twitter:image", content: "/og.png" },
		],
		links: [
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
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
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
