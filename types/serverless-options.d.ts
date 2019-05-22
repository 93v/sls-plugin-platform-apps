import Serverless from "serverless";

export interface IServerlessOptions extends Serverless.Options {
  app?: string;
}
