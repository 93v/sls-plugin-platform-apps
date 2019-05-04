import Serverless from 'serverless';
import { oc } from 'ts-optchain';
import { IPlatformApp, IPlatformAppsMap } from '../types/platform-app';
import { IProvider } from '../types/provider';
import { IServerlessOptions } from '../types/serverless-options';
import { IServerlessPluginCommand } from '../types/serverless-plugin-command';

class ServerlessPlugin {
  public hooks: {
    [event: string]: () => Promise<void>;
  };
  public commands: {
    [command: string]: IServerlessPluginCommand;
  };
  public provider: IProvider;
  private platformAppsMap: IPlatformAppsMap;
  constructor(
    private serverless: Serverless,
    private options: IServerlessOptions,
  ) {
    this.provider = this.serverless.getProvider('aws');

    this.commands = {
      deploy: {
        commands: {
          platformApps: {
            lifecycleEvents: ['deploy'],
            options: { app: { usage: 'Platform App name to Deploy' } },
            usage: 'Deploy Platform Apps',
          },
        },
      },
      remove: {
        commands: {
          platformApps: {
            lifecycleEvents: ['remove'],
            options: { app: { usage: 'Platform App name to Remove' } },
            usage: 'Remove Platform Apps',
          },
        },
      },
    };

    this.hooks = {
      'after:info:info': this.getPlatformAppsInfo.bind(this),
      'before:deploy:deploy': this.deployPlatformApps.bind(this),
      'deploy:platformApps:deploy': this.deployPlatformApps.bind(this),
      'remove:platformApps:remove': this.removePlatformApps.bind(this),
    };

    const apps = oc(this.serverless).service.custom.platformApps(
      {},
    ) as IPlatformAppsMap;
    this.platformAppsMap = {};
    Object.keys(apps).forEach((k) => {
      if (this.isValidPlatformApp(apps[k])) {
        this.platformAppsMap[k] = apps[k];
      }
    });
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

  private getApps(purpose: 'deploy' | 'remove' | 'describe' = 'deploy') {
    if (Object.keys(this.platformAppsMap).length === 0) {
      throw new Error(
        'No Platform Apps are defined. Add one to custom.platformApps section',
      );
    }

    const apps = { ...this.platformAppsMap };
    if (this.options.app != null) {
      Object.keys(apps).forEach((k) => {
        if (k !== this.options.app) {
          delete apps[k];
        }
      });
    }

    if (Object.keys(apps).length === 0) {
      throw new Error(`Nothing to ${purpose}. Check your app name`);
    }

    return apps;
  }

  private async deployPlatformApps() {
    try {
      return this.deployApps(this.getApps('deploy'));
    } catch (error) {
      this.serverless.cli.log(error);
      return;
    }
  }

  private async removePlatformApps() {
    try {
      return this.removeApps(this.getApps('remove'));
    } catch (error) {
      this.serverless.cli.log(error);
      return;
    }
  }

  private async getPlatformAppsInfo() {
    try {
      return this.describeApps(this.getApps('describe'));
    } catch (error) {
      this.serverless.cli.log(error);
      return;
    }
  }

  private async deployApps(apps: IPlatformAppsMap) {
    this.serverless.cli.log('Deploying platform apps...');
    await Promise.all(
      Object.values(apps).map(async (app) => {
        await this.createApp(app);
        this.serverless.cli.log(
          `Platform app ${app.name} successfully created/updated.`,
        );
      }),
    );
  }

  private async removeApps(apps: IPlatformAppsMap) {
    this.serverless.cli.log('Removing platform apps...');
    await Promise.all(
      Object.values(apps).map(async (app) => {
        await this.deleteApp(app);
        this.serverless.cli.log(
          `Platform app ${app.name} successfully deleted.`,
        );
      }),
    );
  }

  private async describeApps(apps: IPlatformAppsMap) {
    this.serverless.cli.log('Describing platform apps...');
    const platformApps = await Promise.all(
      Object.values(apps).map(async (app) => ({
        ...app,
        arn: await this.describeApp(app),
      })),
    );
    platformApps.forEach((app) =>
      this.serverless.cli.log(`  ${app.name}: ${app.arn || 'does not exist'}`),
    );
  }

  private async createApp(app: IPlatformApp) {
    this.serverless.cli.log(`Creating/Updating platform app ${app.name}...`);
    return this.provider.request(
      'SNS',
      'createPlatformApplication',
      {
        Attributes: { PlatformCredential: app.credential },
        Name: app.name,
        Platform: app.platform,
      },
      this.options.stage,
      this.options.region,
    );
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
}

export = ServerlessPlugin;
