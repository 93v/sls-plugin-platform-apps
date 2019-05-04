# sls-plugin-platform-apps

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
      name: '${self:service}-${self:provider.stage}'
      platform: GCM
      credential: '${self:custom.secrets.FIREBASE_SERVER_KEY}'
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
