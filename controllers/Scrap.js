const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const cheerio = require("cheerio");
const path = require("path");
class Scarp {
  static async scrap(req, res) {
    let { url, selectors } = Object.assign({}, req.query, req.body);

    if (Array.isArray(selectors)) {
      selectors = JSON.stringify(selectors);
    }
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!selectors) {
      return res.status(400).json({ error: "Selectors are required" });
    }

    try {
      // Launch Puppeteer browser
      const browser = await puppeteer.launch({
        args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chromium.defaultViewport,
        ignoreDefaultArgs: ["--disable-extensions"],
        executablePath: path.join(
          __dirname,
          "../node_modules/@sparticuz/chromium/bin/"
        ),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });

      const page = await browser.newPage();

      // Set custom headers
      await page.setExtraHTTPHeaders({
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
        "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Brave";v="126"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-User": "?1",
        "Sec-Gpc": "1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      });

      // Navigate to the URL
      await page.goto(url, { waitUntil: "networkidle2", timeout: 1200000 });

      // Get the page content
      const content = await page.content();
      await browser.close();

      const $ = cheerio.load(content);
      let results = {};

      if (!selectors) {
        selectors = [];
      }

      selectors = JSON.parse(selectors);

      selectors.forEach((selector) => {
        const scrapedData = Scarp.formatScraping(selector, $);
        results = { ...results, [selector.name]: scrapedData };
      });

      res.json(results);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: error.message });
    }
  }

  static formatChildren($, parentEl, children) {
    let results = {};
    children.forEach((child) => {
      const el = $(parentEl).find(child.tag);
      const value = Scarp.getValue(child.type, el, $);
      const key = child.name;
      results[key] = value;
    });
    return results;
  }

  static formatScraping(selector, $) {
    let results = [];

    $(selector.parentTag).each((index, element) => {
      results.push(Scarp.formatChildren($, element, selector.children));
    });

    console.log(`Found ${results.length} items for selector ${selector.name}`);
    return results;
  }

  static getValue(type, element, $) {
    let val = "";
    switch (type) {
      case "value":
        val = $(element).val(); // For input fields
        break;
      case "text":
        val = $(element).text().trim(); // Default to text content
        break;
      case "no_value":
        val = null;
        break;
      default:
        val = $(element).attr(type);
        break;
    }
    return val ?? "";
  }
}

module.exports = Scarp;
