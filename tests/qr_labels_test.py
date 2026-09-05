import csv
import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("labels", Path(__file__).parents[1] / "scripts/generate_qr_labels.py")
labels = importlib.util.module_from_spec(spec)
spec.loader.exec_module(labels)

class LabelTests(unittest.TestCase):
    def test_placeholder_origin_rejected(self):
        for value in ["https://yourdomain.com", "http://site.test", "https://site.test/path"]:
            with self.assertRaises(ValueError):
                labels.origin(value)

    def test_exact_machine_inventory(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "machines.csv"
            with path.open("w") as target:
                writer = csv.writer(target)
                writer.writerow(["id", "qr_token"])
                for kind, count in [("washer", 41), ("dryer", 32)]:
                    for number in range(1, count + 1):
                        writer.writerow([f"{kind}_{number}", f"test-only-{kind}-{number}"])
            rows = labels.load_machines(path)
            self.assertEqual(len(rows), 73)
            self.assertEqual(rows[0]["id"], "washer_1")
            self.assertEqual(rows[-1]["id"], "dryer_32")

if __name__ == "__main__":
    unittest.main()
