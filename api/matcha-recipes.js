const RECIPES_URL = "https://www.jadeleafmatcha.com/blogs/matcha-recipes";

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value = "") {
  return decodeHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function inferTag(title = "", description = "") {
  const haystack = `${title} ${description}`.toLowerCase();

  if (haystack.includes("iced")) return "iced";
  if (haystack.includes("latte")) return "latte";
  if (haystack.includes("cookie") || haystack.includes("cake") || haystack.includes("bread")) {
    return "dessert";
  }
  if (haystack.includes("easy")) return "easy";
  if (haystack.includes("hot")) return "hot";
  return "creative";
}

function extractCards(html) {
  const cards = [];
  const regex =
    /<a[^>]+href="(\/blogs\/matcha-recipes\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const seenLinks = new Set();
  let match;

  while ((match = regex.exec(html)) && cards.length < 6) {
    const link = `https://www.jadeleafmatcha.com${match[1]}`;
    if (seenLinks.has(link)) continue;

    const block = match[2];
    const text = stripTags(block);
    if (!text || text.length < 12) continue;
    if (text.toLowerCase().includes("view all")) continue;

    const lines = text.split(/\s{2,}|\n+/).map((line) => line.trim()).filter(Boolean);
    const title = lines[lines.length - 1];
    if (!title || title.length < 6) continue;

    seenLinks.add(link);
    cards.push({ link, title });
  }

  return cards;
}

function extractMeta(html, property, attr = "property") {
  const regex = new RegExp(
    `<meta[^>]+${attr}=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const match = html.match(regex);
  return match ? decodeHtml(match[1]) : "";
}

function extractFirstParagraph(html) {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return match ? stripTags(match[1]) : "";
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Matcha-Mode-Recipes/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Recipe fetch failed with ${response.status}`);
  }

  return response.text();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const listingHtml = await fetchText(RECIPES_URL);
    const cards = extractCards(listingHtml);

    if (!cards.length) {
      throw new Error("No recipe cards found");
    }

    const recipes = await Promise.all(
      cards.map(async (card) => {
        const articleHtml = await fetchText(card.link);
        const title = extractMeta(articleHtml, "og:title") || card.title;
        const description =
          extractMeta(articleHtml, "og:description", "property") ||
          extractMeta(articleHtml, "description", "name") ||
          extractFirstParagraph(articleHtml) ||
          "A fresh matcha recipe to try.";
        const image = extractMeta(articleHtml, "og:image");

        return {
          title: title.replace(/\s*[–-]\s*Jade Leaf Matcha US$/i, "").trim(),
          description,
          image,
          link: card.link,
          source: "Jade Leaf Matcha US",
          tag: inferTag(title, description),
        };
      })
    );

    res.setHeader("Cache-Control", "s-maxage=259200, stale-while-revalidate=86400");
    return res.status(200).json({
      fetchedAt: new Date().toISOString(),
      refreshDays: 3,
      source: RECIPES_URL,
      recipes,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to fetch live matcha recipes",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
