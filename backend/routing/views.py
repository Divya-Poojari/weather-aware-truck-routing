from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from .services import analyze_trip

def health(request):
    return JsonResponse({"status": "ok", "service": "weather-aware-truck-routing"})

class RouteAnalysisView(APIView):
    def post(self, request):
        required = ["origin", "destination", "departure_datetime", "load_weight_lb"]
        missing = [key for key in required if request.data.get(key) in (None, "")]
        if missing:
            return Response({"error": "Missing required fields", "fields": missing}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = analyze_trip(
                origin=str(request.data["origin"]).strip(),
                destination=str(request.data["destination"]).strip(),
                departure_datetime=str(request.data["departure_datetime"]),
                load_weight_lb=float(request.data["load_weight_lb"]),
                spacing=float(request.data.get("sample_spacing_miles", 25)),
            )
            return Response(result)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"error": f"Unable to analyze trip: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)
