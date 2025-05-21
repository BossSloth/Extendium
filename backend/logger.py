try:
  import PluginUtils  # type: ignore[import]

  logger = PluginUtils.Logger()
except Exception as e:
  logger = None

