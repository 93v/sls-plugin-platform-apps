import AwsProvider from "serverless/plugins/aws/provider/awsProvider";

export interface Provider extends AwsProvider {
  request: any;
}
