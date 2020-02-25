# sls-plugin-platform-apps

![David](https://img.shields.io/david/93v/sls-plugin-platform-apps)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/93v/sls-plugin-platform-apps.svg)
![GitHub repo size](https://img.shields.io/github/repo-size/93v/sls-plugin-platform-apps.svg)
![npm](https://img.shields.io/npm/dw/sls-plugin-platform-apps.svg)
![npm](https://img.shields.io/npm/dm/sls-plugin-platform-apps.svg)
![npm](https://img.shields.io/npm/dy/sls-plugin-platform-apps.svg)
![npm](https://img.shields.io/npm/dt/sls-plugin-platform-apps.svg)
![NPM](https://img.shields.io/npm/l/sls-plugin-platform-apps.svg)
![npm](https://img.shields.io/npm/v/sls-plugin-platform-apps.svg)
![GitHub last commit](https://img.shields.io/github/last-commit/93v/sls-plugin-platform-apps.svg)
![npm collaborators](https://img.shields.io/npm/collaborators/sls-plugin-platform-apps.svg)

Serverless Framework Plugin to Deploy and Remove AWS Platform Apps

## Installation

To install with npm, run this in your service directory:

```bash
npm install --save sls-plugin-platform-apps
```

Then add this to your `serverless.yml`

```yml
plugins:
  - sls-plugin-platform-apps
```

## Configuration

To define Platform Apps, add a `platformApps` section like this to your
`serverless.yml`:

```yml
custom:
  platformApps:
    gcm:
      name: "${self:service}-${self:provider.stage}"
      platform: GCM
      credential: "${self:custom.secrets.FIREBASE_SERVER_KEY}"
```

## Command Line Usage

Your Platform Apps will be deployed automatically when you run:

```bash
sls deploy
```

To deploy all Platform Apps without deploying the Serverless service, use:

```bash
sls deploy platformApps
```

To deploy a single Platform App without deploying the Serverless service, use:

```bash
sls deploy platformApps --app [appName]
```

To remove a single Platform App without removing the Serverless service, use:

```bash
sls remove platformApps --app [appName]
```

To remove all Platform Apps without removing the Serverless service, use:

```bash
sls remove platformApps
```

## TODO

- Add tests
