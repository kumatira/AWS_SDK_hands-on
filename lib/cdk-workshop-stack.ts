import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { readFileSync } from 'fs';
import { CfnOutput } from 'aws-cdk-lib';

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //VPCを宣言
    const vpc = new ec2.Vpc(this, 'BlogVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });

    //EC2インスタンスを宣言
    const webServer1 = new ec2.Instance(this, 'WordpressServer1', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      },),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const script = readFileSync('./lib/resources/user-data.sh', 'utf-8');
    webServer1.addUserData(script);
    webServer1.connections.allowFromAnyIpv4(ec2.Port.tcp(80))

    new CfnOutput(this, 'WordpressServer1PublicIPaddress', {
      value: `http://${webServer1.instancePublicIp}`
    })

    //RDSインスタンスを宣言
    const dbServer = new rds.DatabaseInstance(this, 'wordpressDB1', {
      vpc: vpc,
      engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0_31 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      databaseName: 'wordpress',
    });

    dbServer.connections.allowDefaultPortFrom(webServer1);
  }
}
