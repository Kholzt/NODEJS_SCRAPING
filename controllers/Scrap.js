const axios = require("axios");
const cheerio = require("cheerio");

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
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });
      const $ = cheerio.load(response.data);
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

  static formatScraping(selector, $, parentEl = null) {
    let results = [];

    $(selector.parentTag).each((index, element) => {
      results.push(Scarp.formatChildren($, element, selector.children));
    });

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
