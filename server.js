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

app.listen(PORT, "0.0.0.0", () => {
console.log("Payment RLzzT berjalan di port " + PORT);
});
