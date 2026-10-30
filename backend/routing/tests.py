from django.test import SimpleTestCase
from .risk import classify_wind, classify_rain, classify_snow, assess_checkpoint

class RiskThresholdTests(SimpleTestCase):
    def test_wind_thresholds(self):
        self.assertEqual(classify_wind(24.9), "Low")
        self.assertEqual(classify_wind(25), "Moderate")
        self.assertEqual(classify_wind(35), "High")
        self.assertEqual(classify_wind(45), "Severe")
        self.assertEqual(classify_wind(55), "No Travel")

    def test_rain_thresholds(self):
        self.assertEqual(classify_rain(0.09), "Low")
        self.assertEqual(classify_rain(0.10), "Moderate")
        self.assertEqual(classify_rain(0.25), "High")
        self.assertEqual(classify_rain(0.50), "Severe")
        self.assertEqual(classify_rain(1.01), "No Travel")

    def test_snow_thresholds(self):
        self.assertEqual(classify_snow(0.49), "Low")
        self.assertEqual(classify_snow(0.5), "Moderate")
        self.assertEqual(classify_snow(1), "High")
        self.assertEqual(classify_snow(2), "Severe")
        self.assertEqual(classify_snow(3.1), "No Travel")

    def test_load_adjusted_wind(self):
        self.assertEqual(assess_checkpoint(50, 0, 0, 30001)[0], "No Travel")
        self.assertEqual(assess_checkpoint(40, 0, 0, 40001)[0], "Severe")
        self.assertEqual(assess_checkpoint(40, 0, 0, 40000)[0], "High")
