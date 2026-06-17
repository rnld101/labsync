import boto3

from .config import settings

_s3 = boto3.client("s3", region_name=settings.aws_region)


def generate_presigned_get_url(object_key: str) -> str:
    """Presigned GET URL for a private report object, hard-capped to the configured TTL."""
    return _s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.reports_s3_bucket, "Key": object_key},
        ExpiresIn=settings.presigned_url_ttl_seconds,
    )
