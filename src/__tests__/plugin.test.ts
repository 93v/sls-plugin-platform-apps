import ServerlessPlatformAppsPlugin from "../index";

const serverless: any = {
  getProvider: () => ({}),
};
const options: any = {};

describe("Serverless Plugin Platform Apps", () => {
  test("Should meet Serverless Plugin Interface", () => {
    const plugin = new ServerlessPlatformAppsPlugin(serverless, options, {
      log: () => {
        return;
      },
    });
    expect(plugin.hooks).toEqual({
      "after:info:info": expect.any(Function),
      "before:deploy:deploy": expect.any(Function),
      "deploy:platformApps:deploy": expect.any(Function),
      "remove:platformApps:remove": expect.any(Function),
    });
  });
});
