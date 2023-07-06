import type { App, Plugin } from 'circle-cts';

export default function (app: App) {
  let factory: WebSocket | null = null;

  return {
    async start() {
      if (factory) {
        return;
      }
      const url = await app.option('url');
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        app.error('url_error');
        return;
      }
      factory = new WebSocket(url.replace(/https|http/, 'ws'));
      factory.addEventListener('message', (e) => {
        if (e.data === 'reload') {
          app
            .fetch(url)
            .then((plugin: Plugin) => {
              if (!plugin.id) {
                app.error('format_error');
                return;
              }
              app.install(plugin).then((returnValue: boolean) => {
                if (returnValue) {
                  window.location.reload();
                } else {
                  app.error('install_error');
                }
              });
            })
            .catch((err: string) => {
              app.error(err);
            });
        }
      });
      factory.addEventListener('error', () => {
        app.error('socket_error');
      });
    },
    destory() {
      if (!factory || !factory.close) {
        return;
      }
      factory.close();
      factory = null;
    },
  };
}
