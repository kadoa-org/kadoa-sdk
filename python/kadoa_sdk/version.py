try:
    from importlib.metadata import version
    SDK_VERSION = f"python-{version('kadoa-sdk')}"
except Exception:
    SDK_VERSION = "python-0.0.0"
    import warnings
    warnings.warn("Failed to determine package version") 