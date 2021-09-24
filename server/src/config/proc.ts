if (process.env.NODE_ENV !== 'production') {
  process.on('SIGTERM', () => process.exit(0));
  process.on('uncaughtException', (error) => {
    console.error(error);
    process.exit(0);
  });
}
