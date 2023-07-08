import { App, Plugin } from 'circle-ts';
import { isString } from 'circle-utils';

export default function () {
  let factory: WebSocket | null = null;

  return {
    start(app: App) {
      if (factory) {
        return;
      }
      app.option('option').then((option) => {
        if (
          !option ||
          !option.identifier ||
          typeof option.identifier !== 'string'
        ) {
          return;
        }
        const identifier = window.atob(option.identifier);
        const parts = identifier.split('_');
        if (parts.length < 4) {
          app.error('label_error');
          return;
        }
        const [, port, devPort, ...reset] = parts;
        if (!isString(port) || !isString(devPort) || reset.length < 1) {
          app.error('label_error');
          return;
        }
        factory = new WebSocket(`ws://localhost:${port}`);
        factory.addEventListener('message', (e) => {
          if (e.data === 'reload') {
            app
              .fetch(`http://localhost:${devPort}/${reset.join('_')}.json`)
              .then((plugin: Plugin) => {
                if (!plugin.id) {
                  app.error('format_error');
                  return;
                }
                if (!plugin.debug) {
                  plugin.debug = true;
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
          if (app.field('running')) {
            app.error('socket_error');
          }
        });
        return;
      });
    },
    destory() {
      if (!factory || !factory.close) {
        return;
      }
      factory.close();
      factory = null;
    },
    uninstall(app: App) {
      return app.option('option').then((option) => {
        if (
          !option ||
          !option.identifier ||
          typeof option.identifier !== 'string'
        ) {
          return;
        }
        const identifier = window.atob(option.identifier);
        const parts = identifier.split('_');
        if (parts.length < 4) {
          return;
        }
        const [, , , ...reset] = parts;
        if (reset.length < 1) {
          return;
        }
        return app
          .uninstall(reset.join('_'))
          .finally(() => app.remove('option'));
      });
    },
  };
}
