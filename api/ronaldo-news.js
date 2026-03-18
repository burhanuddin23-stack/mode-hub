const GOOGLE_NEWS_RSS =
  "https://news.google.com/rss/search?q=Cristiano%20Ronaldo%20when%3A7d&hl=en-US&gl=US&ceid=US:en";

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value = "") {
  return decodeXml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getTagValue(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? match[1].trim() : "";
}

function extractImageFromDescription(description = "") {
  const imageMatch = description.match(/<img[^>]+src="([^"]+)"/i);
  return imageMatch ? imageMatch[1] : "";
}

function parseItems(xml) {
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  return itemBlocks.slice(0, 6).map((block) => {
    const rawTitle = getTagValue(block, "title");
    const rawLink = getTagValue(block, "link");
    const rawDate = getTagValue(block, "pubDate");
    const rawDescription = getTagValue(block, "description");
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

    return {
      title: stripTags(rawTitle),
      link: decodeXml(rawLink),
      pubDate: rawDate,
      description: stripTags(rawDescription),
      source: sourceMatch ? stripTags(sourceMatch[1]) : "",
      image: extractImageFromDescription(rawDescription),
      category: "news",
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(GOOGLE_NEWS_RSS, {
      headers: {
        "User-Agent": "Ronaldo-Mode-News-Proxy/1.0",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Google News RSS request failed with ${response.status}`);
    }

    const xml = await response.text();
    const items = parseItems(xml).filter((item) => item.title && item.link);

    if (!items.length) {
      throw new Error("No items parsed from RSS feed");
    }

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=21600");
    return res.status(200).json({
      fetchedAt: new Date().toISOString(),
      source: "Google News RSS",
      items,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to fetch live Ronaldo news",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
