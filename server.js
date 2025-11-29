const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");

const app = express();
app.use(bodyParser.json({ limit: "2mb" }));
app.use(bodyParser.text({ type: "text/html", limit: "2mb" }));

let browser;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });
  }
  return browser;
}

app.post("/render", async (req, res) => {
  try {
    const html = typeof req.body === "string" ? req.body : req.body.html;

    if (!html) return res.status(400).json({ error: "Missing HTML" });

    const width = req.body.width || 1024;
    const height = req.body.height || 300;

    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 2
    });

    await page.setContent(html, { waitUntil: "networkidle0" });

    const buffer = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width, height }
    });

    await page.close();

    res.set("Content-Type", "image/png");
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Rendering failed", detail: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("HTML → PNG server running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
