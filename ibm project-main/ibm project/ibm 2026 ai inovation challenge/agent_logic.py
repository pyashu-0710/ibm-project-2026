import os
import google.generativeai as genai
from dotenv import load_dotenv
import math

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY and "your_gemini" not in GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Gemini API Key missing. Using Mock AI.")

class CivicAgent:
    def __init__(self):
        self.model = None
        if GEMINI_API_KEY and "your_gemini" not in GEMINI_API_KEY:
            try:
                self.model = genai.GenerativeModel('gemini-1.5-pro') # Fallback to Pro
            except:
                pass

        # Mock Ward Directory (Lat, Lng)
        self.wards = {
            "Ward A (North)": (22.4200, 72.9100),
            "Ward B (South)": (22.4000, 72.8900),
            "Ward C (Center)": (22.4100, 72.9000),
            "Ward D (East)": (22.4150, 72.9200)
        }

    def analyze_image(self, image_path):
        """
        Uses Gemini to analyze the uploaded image.
        Returns a description and validity.
        """
        if not self.model:
            # Mock behavior
            return "AI Analysis (Mock): The image appears to show a road surface with possible damage. Severity: Moderate."
        
        try:
            # Load the image
            import PIL.Image
            img = PIL.Image.open(image_path)
            
            prompt = """
            You are a Civic Issue Surveyor. Analyze this image.
            1. Identify if there is a civic issue (Pothole, Garbage, Water Logging, Street Light).
            2. If yes, describe it briefly (1 sentence).
            3. Estimate severity (Low/Medium/High).
            If no issue is found, say "No relevant issue detected."
            """
            response = self.model.generate_content([prompt, img])
            return response.text
        except Exception as e:
            return f"AI Analysis Failed: {e}"

    def assign_ward(self, lat, lng):
        """
        Assigns the issue to the nearest ward office based on coordinates.
        Uses simple Euclidian distance for now (sufficient for small city areas).
        """
        if not lat or not lng:
            return "Unknown Ward"

        min_dist = float('inf')
        nearest_ward = "General Municipal Office"

        for ward_name, (w_lat, w_lng) in self.wards.items():
            # Approximate distance (Pythagoras)
            dist = math.sqrt((w_lat - float(lat))**2 + (w_lng - float(lng))**2)
            if dist < min_dist:
                min_dist = dist
                nearest_ward = ward_name
        
        return nearest_ward

# Singleton instance
agent = CivicAgent()
