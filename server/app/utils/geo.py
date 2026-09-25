from typing import Optional, Dict, Any
from geoalchemy2.shape import to_shape
import shapely.geometry
import shapely.wkt


def shape_to_geojson(geom: Any) -> Optional[Dict[str, Any]]:
    """
    Converts GeoAlchemy2 geometry / WKBElement / WKTElement to a GeoJSON-compatible dictionary.
    """
    if geom is None:
        return None
    if isinstance(geom, dict):
        return geom
    try:
        shape = to_shape(geom)
        return shapely.geometry.mapping(shape)
    except Exception:
        pass

    # Fallback for WKTElement or WKT string
    try:
        wkt_str = getattr(geom, "data", str(geom))
        shape = shapely.wkt.loads(wkt_str)
        return shapely.geometry.mapping(shape)
    except Exception:
        return None


def extract_centroid(geom: Any) -> tuple[Optional[float], Optional[float]]:
    """
    Extracts (latitude, longitude) centroid coordinates from a GeoAlchemy2 geometry, WKT string, or GeoJSON dict.
    Returns (lat, lon) or (None, None) if unavailable.
    """
    if geom is None:
        return None, None
    try:
        shape = to_shape(geom)
        centroid = shape.centroid
        return float(centroid.y), float(centroid.x)
    except Exception:
        pass

    try:
        wkt_str = getattr(geom, "data", str(geom))
        wkt_clean = str(wkt_str).split(";")[-1]
        shape = shapely.wkt.loads(wkt_clean)
        centroid = shape.centroid
        return float(centroid.y), float(centroid.x)
    except Exception:
        pass

    if isinstance(geom, dict) and "coordinates" in geom:
        try:
            coords = geom["coordinates"]
            if geom.get("type") == "Point":
                return float(coords[1]), float(coords[0])
            elif geom.get("type") == "Polygon":
                pts = coords[0]
                lons = [p[0] for p in pts]
                lats = [p[1] for p in pts]
                return float(sum(lats) / len(lats)), float(sum(lons) / len(lons))
        except Exception:
            pass

    return None, None

