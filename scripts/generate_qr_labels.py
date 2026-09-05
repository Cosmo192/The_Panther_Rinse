"""Generate production-validated 2-inch laundry stickers. Never generates tokens."""
import argparse
import csv
import json
from pathlib import Path
from urllib.parse import urlencode, urlparse
from urllib.request import urlopen


def load_machines(path):
    with open(path, newline="", encoding="utf-8-sig") as source:
        rows = list(csv.DictReader(source))
    expected = ({f"washer_{number}" for number in range(1, 42)}
                | {f"dryer_{number}" for number in range(1, 33)})
    if len(rows) != 73 or {row.get("id") for row in rows} != expected:
        raise ValueError("CSV must contain exactly washer_1..41 and dryer_1..32.")
    tokens = [row.get("qr_token", "").strip() for row in rows]
    if not all(tokens) or len(set(tokens)) != 73:
        raise ValueError("Expected 73 nonempty, distinct database QR tokens.")
    for row, token in zip(rows, tokens):
        row["qr_token"] = token
    return sorted(rows, key=lambda row: (row["id"].startswith("dryer"), int(row["id"].split("_")[1])))


def origin(value):
    parsed = urlparse(value)
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password
            or parsed.query or parsed.fragment or parsed.path not in ("", "/")
            or parsed.hostname in ("yourdomain.com", "example.com", "localhost")):
        raise ValueError("Use a real HTTPS production origin without a path, credentials, or query.")
    return value.rstrip("/")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--machines", required=True, help="Private CSV export with id and qr_token columns")
    parser.add_argument("--origin", required=True, help="Stable frontend production origin")
    parser.add_argument("--supabase-url", required=True, help="Supabase project HTTPS origin")
    parser.add_argument("--output", default="outputs/qr-labels")
    args = parser.parse_args()
    rows = load_machines(args.machines)
    frontend, backend = origin(args.origin), origin(args.supabase_url)
    destination = Path(args.output)
    if destination.exists():
        raise ValueError("Output directory already exists; choose a new one to avoid overwriting labels.")
    # Validate every token and the frontend deep-link route before authoring.
    # GET only: this never starts or releases a machine.
    for row in rows:
        query = urlencode({"token": row["qr_token"]})
        with urlopen(f"{backend}/functions/v1/validate-qr-token?{query}", timeout=15) as response:
            payload = json.load(response)
        if not payload.get("valid") or payload.get("machine_id") != row["id"]:
            raise ValueError(f"Backend validation failed for {row['id']}; no labels generated.")
        row["url"] = f"{frontend}/scan?{query}"
        with urlopen(row["url"], timeout=15) as response:
            if response.status != 200 or "text/html" not in response.headers.get("Content-Type", ""):
                raise ValueError(f"Frontend route failed for {row['id']}.")

    import qrcode
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    destination.mkdir(parents=True)
    pdf = canvas.Canvas(str(destination / "laundry-stickers.pdf"), pagesize=letter)
    pdf.setTitle("GSU Laundry - 2 inch machine labels")
    for index, row in enumerate(rows):
        slot = index % 15
        if slot == 0:
            pdf.setFont("Helvetica", 8)
            pdf.drawCentredString(306, 776, "Print at 100% / Actual size. Each cut square is 2 x 2 inches.")
        column, line = slot % 3, slot // 3
        x, y = 90 + column * 144, 750 - (line + 1) * 144
        label = row["id"].replace("_", " ").title()
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=4)
        qr.add_data(row["url"])
        qr.make(fit=True)
        png = destination / f"{row['id']}.png"
        qr.make_image(fill_color="black", back_color="white").save(png)
        pdf.setStrokeColorRGB(.65, .65, .65)
        pdf.setDash(2, 2)
        pdf.rect(x, y, 144, 144)
        pdf.setDash()
        pdf.setFillColorRGB(0, 0, 0)
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawCentredString(x + 72, y + 130, label)
        pdf.drawImage(str(png), x + 17, y + 17, width=110, height=110)
        pdf.setFont("Helvetica", 7)
        pdf.drawCentredString(x + 72, y + 8, "Scan to start or finish your laundry")
        if slot == 14:
            pdf.showPage()
    pdf.save()
    # Keep this private alongside the PDF, never in the hosted public folder.
    (destination / "manifest.json").write_text(json.dumps(
        [{"machine_id": row["id"], "url": row["url"]} for row in rows], indent=2))
    print("Created 73 PNG codes and a five-page US Letter PDF. Physical scan QA is still required.")


if __name__ == "__main__":
    main()
