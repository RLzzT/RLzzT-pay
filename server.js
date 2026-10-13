
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Payment RLzzT backend aktif"
  });
});

async function buatQris(params) {
  const accountId = process.env.BUATQRIS_ACCOUNT_ID;
  const secretToken = process.env.BUATQRIS_SECRET_TOKEN;

  if (!accountId || !secretToken) {
    throw new Error("Environment Variables BuatQris belum lengkap");
  }

  const response = await fetch("https://api.buatqris.site", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      action: params.action,
      account_id: accountId,
      secret_token: secretToken,
      ...params.data
    })
  });

  const result = await response.json();

  if (!response.ok || result.success !== true) {
    throw new Error(result.message || "Permintaan BuatQris gagal");
  }

  return result.data;
}

app.post("/api/create-qris", async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isSafeInteger(amount) || amount < 1000) {
      return res.status(400).json({
        success: false,
        message: "Nominal minimal Rp1.000"
      });
    }

    const data = await buatQris({
      action: "api_create_qris",
      data: {
        amount: String(amount),
        description: "Payment RLzzT"
      }
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Buat QRIS gagal:", error.message);
    res.status(502).json({
      success: false,
      message: error.message
    });
  }
});

app.post("/api/check-qris", async (req, res) => {
  try {
    const transactionId = String(
      req.body.transaction_id || ""
    ).trim();

    if (!transactionId || transactionId.length > 100) {
      return res.status(400).json({
        success: false,
        message: "ID transaksi tidak valid"
      });
    }

    const data = await buatQris({
      action: "api_check_status",
      data: {
        transaction_id: transactionId
      }
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Cek status gagal:", error.message);
    res.status(502).json({
      success: false,
      message: error.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Payment RLzzT berjalan di port " + PORT);
});
