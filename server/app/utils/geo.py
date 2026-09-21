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
