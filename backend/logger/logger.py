try:
    import PluginUtils  # type: ignore[import]

    logger = PluginUtils.Logger()
except Exception as e:
    class Logger:
        def log(self, message: str):
            print(message)
        def error(self, message: str):
            print(message)

    logger = Logger()

