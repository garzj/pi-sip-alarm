import getPort from 'get-port';

export async function findPort(preferred?: number) {
  const port = await getPort(
    preferred === undefined ? undefined : { port: preferred }
  );

  if (preferred !== undefined && port !== preferred) {
    console.warn(
      `Preferred port ${preferred} was already in use, using ${port} instead.`
    );
  }

  return port;
}
