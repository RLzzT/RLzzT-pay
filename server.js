
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Payment RLzzT Backend Aktif!");
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
      account_id: accountId,
      secret_token: secretToken,
      ...params
    })
  });

  const data = await response.json();

  if (!response.ok || data.success !== true) {
    throw new Error(data.message || "Permintaan BuatQris gagal");
  }

  return data.data;
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

    const result = await buatQris({
      action: "api_create_qris",
      amount: String(amount),
      description: "Payment RLzzT"
    });

    res.json({
      success: true,
      data: {
        transaction_id: result.transaction_id,
        qr_url: result.qr_url,
        payment_url: result.payment_url,
        amount: result.amount,
        status: result.status
      }
    });
  } catch (error) {
    console.error("Create QRIS gagal:", error.message);
    res.status(502).json({
      success: false,
      message: "Gagal membuat QRIS. Periksa konfigurasi dan log server."
    });
  }
});

app.post("/api/check-qris", async (req, res) => {
  try {
    const transactionId = String(req.body.transaction_id || "").trim();

    if (!transactionId || transactionId.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID tidak valid"
      });
    }

    const result = await buatQris({
      action: "api_check_status",
      transaction_id: transactionId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Cek status gagal:", error.message);
    res.status(502).json({
      success: false,
      message: "Gagal memeriksa status pembayaran"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Payment RLzzT berjalan di port " + PORT);
});
