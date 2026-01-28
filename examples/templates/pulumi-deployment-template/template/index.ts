import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Create an S3 bucket
const bucket = new aws.s3.Bucket("my-bucket", {
    tags: {
        Name: "${{ values.name }}-bucket",
        Environment: "${{ values.stack }}",
        ManagedBy: "pulumi",
    },
});

// Export the bucket name and ARN
export const bucketName = bucket.id;
export const bucketArn = bucket.arn;
