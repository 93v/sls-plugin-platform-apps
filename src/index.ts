import { oc } from 'ts-optchain';
import { IPlatformApp, IPlatformAppsMap } from '../types/platform-app';
import { IServerlessPluginCommand } from '../types/serverless-plugin-command';

class ServerlessPlugin {
  public commands: {
    [key: string]: IServerlessPluginCommand;
  };
  public hooks: object;
  public provider: any;

  constructor(private serverless: any, private options: any) {
    this.provider = this.serverless.getProvider('aws');

    this.commands = {
      deploy: {
        commands: {
          platformApps: {
            lifecycleEvents: ['deploy'],
            options: {
              app: {
                required: false,
                usage: 'Platform App name to Deploy',
              },
            },
            usage: 'Deploy Platform Apps',
          },
        },
      },
      remove: {
        commands: {
          platformApps: {
            lifecycleEvents: ['remove'],
            options: {
              app: {
                required: false,
                usage: 'Platform App name to Remove',
              },
            },
            usage: 'Remove Platform Apps',
          },
        },
      },
    };

    this.hooks = {
      'before:deploy:deploy': this.deployPlatformApps.bind(this),

      'deploy:platformApps:deploy': this.deployPlatformApps.bind(this),
      'remove:platformApps:remove': this.removePlatformApps.bind(this),

      'after:info:info': this.afterInfoGlobal.bind(this),
    };
  }

  private isValidPlatformApp(app: IPlatformApp) {
    return (
      typeof app.credential === 'string' &&
      app.credential !== '' &&
      typeof app.name === 'string' &&
      app.name !== '' &&
      typeof app.platform === 'string' &&
      ['GCM'].includes(app.platform.toUpperCase())
    );
  }

  private getPlatformApps() {
    const apps = oc(this.serverless).service.custom.platformApps(
      {},
    ) as IPlatformAppsMap;
    const validApps: IPlatformAppsMap = {};
    Object.keys(apps).forEach((k) => {
      if (this.isValidPlatformApp(apps[k])) {
        validApps[k] = apps[k];
      }
    });
    return validApps;
  }

  private async deployPlatformApps() {
    const apps = this.getPlatformApps();

    if (Object.keys(apps).length === 0) {
      this.serverless.cli.log('No Platform Apps are defined');
      this.serverless.cli.log('Add one to custom.platformApps section');
      return;
    }

    const appsToDeploy = apps;
    if (this.options.app != null) {
      Object.keys(appsToDeploy).forEach((k) => {
        if (k !== this.options.app) {
          delete appsToDeploy[k];
        }
      });
    }

    if (Object.keys(appsToDeploy).length === 0) {
      this.serverless.cli.log('Nothing to deploy');
      this.serverless.cli.log('Check your app name');
      return;
    }

    this.serverless.cli.log('Deploying platform apps...');
    return this.deployApps(appsToDeploy);
  }

  private async deployApps(apps: IPlatformAppsMap) {
    for (const index in apps) {
      if (apps.hasOwnProperty(index)) {
        await this.createApp(apps[index]);
        this.serverless.cli.log(
          `Platform app ${apps[index].name} successfully created/updated.`,
        );
      }
    }
  }

  private async createApp(app: IPlatformApp) {
    const params = {
      Attributes: { PlatformCredential: app.credential },
      Name: app.name,
      Platform: app.platform,
    };
    this.serverless.cli.log(`Creating/Updating platform app ${app.name}...`);
    return this.provider.request(
      'SNS',
      'createPlatformApplication',
      params,
      this.options.stage,
      this.options.region,
    );
  }

  private async removePlatformApps() {
    const apps = this.getPlatformApps();

    if (Object.keys(apps).length === 0) {
      this.serverless.cli.log('No Platform Apps are defined');
      this.serverless.cli.log('Add one to custom.platformApps section');
      return;
    }

    const appsToRemove = apps;
    if (this.options.app != null) {
      Object.keys(appsToRemove).forEach((k) => {
        if (k !== this.options.app) {
          delete appsToRemove[k];
        }
      });
    }

    if (Object.keys(appsToRemove).length === 0) {
      this.serverless.cli.log('Nothing to remove');
      this.serverless.cli.log('Check your app name');
      return;
    }

    this.serverless.cli.log('Removing platform apps...');
    return this.removeApps(appsToRemove);
  }

  private async removeApps(apps: IPlatformAppsMap) {
    for (const index in apps) {
      if (apps.hasOwnProperty(index)) {
        await this.deleteApp(apps[index]);
        this.serverless.cli.log(
          `Platform app ${apps[index].name} successfully deleted.`,
        );
      }
    }
  }

  private async deleteApp(app: IPlatformApp) {
    const arn = await this.describeApp(app);
    if (arn == null) {
      this.serverless.cli.log(`  ${app.name}: does not exist`);
      return;
    }
    this.serverless.cli.log(`Removing platform app ${app.name}...`);
    return this.provider.request(
      'SNS',
      'deletePlatformApplication',
      { PlatformApplicationArn: arn },
      this.options.stage,
      this.options.region,
    );
  }

  private async describeApp(app: IPlatformApp) {
    try {
      const response = await this.provider.request(
        'SNS',
        'listPlatformApplications',
        {},
        this.options.stage,
        this.options.region,
      );

      if (response.PlatformApplications == null) {
        return null;
      }

      return Object.values(response.PlatformApplications)
        .map((a: any) => a.PlatformApplicationArn)
        .find((arn: string) => arn.includes(`/${app.platform}/${app.name}`));
    } catch (error) {
      if (error.message && error.message.match(/does not exist$/)) {
        return null;
      }
      throw error;
    }
  }

  private async afterInfoGlobal() {
    const apps = this.getPlatformApps();

    if (Object.keys(apps).length === 0) {
      this.serverless.cli.log('No Platform Apps are defined');
      this.serverless.cli.log('Add one to custom.platformApps section');
      return;
    }

    const appsToCheck = apps;
    if (this.options.app != null) {
      Object.keys(appsToCheck).forEach((k) => {
        if (k !== this.options.app) {
          delete appsToCheck[k];
        }
      });
    }

    if (Object.keys(appsToCheck).length === 0) {
      this.serverless.cli.log('Nothing to get info about');
      this.serverless.cli.log('Check your app name');
      return;
    }

    this.serverless.cli.log('Getting info about platform apps...');
    return this.getAppsInfo(appsToCheck);
  }

  private async getAppsInfo(apps: IPlatformAppsMap) {
    for (const index in apps) {
      if (apps.hasOwnProperty(index)) {
        const arn = await this.describeApp(apps[index]);
        if (arn) {
          this.serverless.cli.consoleLog(`  ${apps[index].name}: ${arn}`);
        } else {
          this.serverless.cli.consoleLog(
            `  ${apps[index].name}: does not exist`,
          );
        }
      }
    }
  }
}

module.exports = ServerlessPlugin;
