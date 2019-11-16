import Serverless from "serverless";

export interface ServerlessOptions extends Serverless.Options {
  app?: string;
}
